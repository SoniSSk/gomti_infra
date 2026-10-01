/* eslint-disable @typescript-eslint/no-explicit-any */
import getMongoClient from "@/app/lib/mongodb";
import { auth } from "@/auth";
import { canAccessLab, isSuperAdminRole } from "@/app/utils/vehiclePermissions";
import { NextRequest, NextResponse } from "next/server";

const DB_NAME = "gomti_infra";
const COLLECTION = "lab";

/* Fields the edit form may change; anything else in the body is ignored. */
const EDITABLE_FIELDS = [
  "status",
  "holdReason",
  "cancelReason",
  "assignedTo",
  "lot",
  "lotDescription",
  "size",
  "sampleTakenBy",
  "sampleTakenAt",
  "expectedReportAt",
  "reportDoneAt",
  "report",
  "documents",
] as const;

/* Timestamps arrive as ISO strings; store them as Dates like createdAt. */
const DATE_FIELDS = new Set<string>([
  "sampleTakenAt",
  "expectedReportAt",
  "reportDoneAt",
]);

const toComparable = (value: unknown) =>
  value instanceof Date ? value.toISOString() : JSON.stringify(value ?? null);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sno: string }> },
) {
  try {
    const session = await auth();

    if (!canAccessLab(session?.user?.role)) {
      return NextResponse.json(
        { success: false, message: "You don't have permission to edit lab records" },
        { status: 403 },
      );
    }

    const { sno } = await params;
    const labSno = Number(sno);

    if (!Number.isFinite(labSno)) {
      return NextResponse.json(
        { success: false, message: "Invalid lab S.No" },
        { status: 400 },
      );
    }

    const body = await req.json();

    const client = await getMongoClient();
    const collection = client.db(DB_NAME).collection(COLLECTION);

    const existing: any = await collection.findOne({ sno: labSno });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Lab record not found" },
        { status: 404 },
      );
    }

    const userName = session?.user?.name ?? session?.user?.email ?? "";
    const now = new Date();

    const updates: Record<string, unknown> = {};
    const unset: Record<string, ""> = {};

    for (const field of EDITABLE_FIELDS) {
      if (!(field in body)) continue;

      let value = body[field];

      if (DATE_FIELDS.has(field) && value) {
        const date = new Date(value);
        value = Number.isNaN(date.getTime()) ? undefined : date;
      }

      // Cleared optional fields are removed rather than stored empty
      if (value === "" || value === null || value === undefined) {
        if (existing[field] !== undefined) unset[field] = "";
        continue;
      }

      if (toComparable(value) !== toComparable(existing[field])) {
        updates[field] = value;
      }
    }

    // Each reason only means something while in its status
    const nextStatus = (updates.status ?? existing.status) as string;
    for (const [status, field] of [
      ["ON_HOLD", "holdReason"],
      ["CANCELLED", "cancelReason"],
    ]) {
      if (nextStatus === status) continue;

      delete updates[field];
      if (existing[field] !== undefined) {
        unset[field] = "";
      } else {
        delete unset[field];
      }
    }

    const changedFields = [...Object.keys(updates), ...Object.keys(unset)];

    if (!changedFields.length) {
      return NextResponse.json({
        success: true,
        message: "No changes to save",
        lab: existing,
      });
    }

    const history = changedFields.map((field) => ({
      field,
      oldValue: existing[field] ?? null,
      newValue: updates[field] ?? null,
      updatedBy: userName,
      updatedAt: now,
    }));

    await collection.updateOne(
      { sno: labSno },
      {
        $set: { ...updates, updatedAt: now, updatedBy: userName },
        ...(Object.keys(unset).length && { $unset: unset }),
        $push: { updateHistory: { $each: history } } as any,
      },
    );

    const lab = await collection.findOne({ sno: labSno });

    return NextResponse.json({
      success: true,
      message: "Lab report updated",
      lab,
    });
  } catch (error: any) {
    console.error("PUT /api/lab/[sno] error:", error);

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update lab record" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sno: string }> },
) {
  try {
    const session = await auth();

    if (!isSuperAdminRole(session?.user?.role)) {
      return NextResponse.json(
        { success: false, message: "Only a super admin can delete lab records" },
        { status: 403 },
      );
    }

    const { sno } = await params;
    const labSno = Number(sno);

    if (!Number.isFinite(labSno)) {
      return NextResponse.json(
        { success: false, message: "Invalid lab S.No" },
        { status: 400 },
      );
    }

    const client = await getMongoClient();
    const result = await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .deleteOne({ sno: labSno });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Lab record not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lab report deleted",
    });
  } catch (error: any) {
    console.error("DELETE /api/lab/[sno] error:", error);

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete lab record" },
      { status: 500 },
    );
  }
}
