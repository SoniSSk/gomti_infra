/* eslint-disable @typescript-eslint/no-explicit-any */
import getMongoClient from "@/app/lib/mongodb";
import { auth } from "@/auth";
import { buildOperationRecord } from "@/app/lib/accounts";
import { isSuperAdminRole } from "@/app/utils/vehiclePermissions";
import { canOpenDashboard } from "@/app/lib/users";
import { accountsDashboardKey } from "@/app/constant/dashboards";
import {
  getAccountBook,
  validateOperation,
  type BusinessOperationInput,
} from "@/app/types/accounts";
import { NextRequest, NextResponse } from "next/server";

const DB_NAME = "gomti_infra";

/* Top-level groups the edit form may replace. */
const EDITABLE_FIELDS = [
  "name",
  "description",
  "account",
  "type",
  "status",
  "document",
] as const;

/* tracking keys the form owns; id and created_* are never touched. */
const EDITABLE_TRACKING = [
  "reference_no",
  "branch",
  "assigned_to",
  "priority",
] as const;

const toComparable = (value: unknown) =>
  value instanceof Date ? value.toISOString() : JSON.stringify(value ?? null);

const pickTracking = (tracking: any = {}) =>
  Object.fromEntries(
    EDITABLE_TRACKING.filter((key) => tracking[key] !== undefined).map(
      (key) => [key, tracking[key]],
    ),
  );

const parseSno = (sno: string) => {
  const value = Number(sno);
  return Number.isFinite(value) ? value : null;
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sno: string }> },
) {
  try {
    const session = await auth();

    const sno = parseSno((await params).sno);

    if (sno === null) {
      return NextResponse.json(
        { success: false, message: "Invalid entry S.No" },
        { status: 400 },
      );
    }

    const book = getAccountBook(req.nextUrl.searchParams.get("book"));

    if (!book) {
      return NextResponse.json(
        { success: false, message: "Unknown account book" },
        { status: 400 },
      );
    }

    if (!(await canOpenDashboard(session?.user, accountsDashboardKey(book.key)))) {
      return NextResponse.json(
        { success: false, message: "You don't have permission to edit accounts entries" },
        { status: 403 },
      );
    }

    const body: BusinessOperationInput = await req.json().catch(() => null);

    const problem = validateOperation(body, book);

    if (problem) {
      return NextResponse.json(
        { success: false, message: problem },
        { status: 400 },
      );
    }

    const client = await getMongoClient();
    const collection = client.db(DB_NAME).collection(book.collection);

    const existing: any = await collection.findOne({ sno });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Entry not found" },
        { status: 404 },
      );
    }

    const userName = session?.user?.name ?? session?.user?.email ?? "";
    const now = new Date();

    const next: Record<string, any> = buildOperationRecord(
      body,
      userName,
      now,
      existing.document,
    );

    const updates: Record<string, unknown> = {};
    const unset: Record<string, ""> = {};

    for (const field of EDITABLE_FIELDS) {
      const value = next[field];

      // A cleared description is removed rather than stored empty
      if (value === "" || value === undefined) {
        if (existing[field] !== undefined) unset[field] = "";
        continue;
      }

      if (toComparable(value) !== toComparable(existing[field])) {
        updates[field] = value;
      }
    }

    const oldTracking = pickTracking(existing.tracking);
    const trackingChanged =
      toComparable(next.tracking) !== toComparable(oldTracking);

    const changedFields = [...Object.keys(updates), ...Object.keys(unset)];

    if (!changedFields.length && !trackingChanged) {
      return NextResponse.json({
        success: true,
        message: "No changes to save",
        operation: existing,
      });
    }

    const history = changedFields.map((field) => ({
      field,
      oldValue: existing[field] ?? null,
      newValue: updates[field] ?? null,
      updatedBy: userName,
      updatedAt: now,
    }));

    if (trackingChanged) {
      history.push({
        field: "tracking",
        oldValue: oldTracking,
        newValue: next.tracking,
        updatedBy: userName,
        updatedAt: now,
      });
    }

    await collection.updateOne(
      { sno },
      {
        $set: {
          ...updates,
          tracking: {
            id: existing.tracking?.id,
            created_date: existing.tracking?.created_date,
            created_by: existing.tracking?.created_by,
            ...next.tracking,
            updated_date: now,
            updated_by: userName,
          },
        },
        ...(Object.keys(unset).length && { $unset: unset }),
        $push: { update_history: { $each: history } } as any,
      },
    );

    const operation = await collection.findOne({ sno });

    return NextResponse.json({
      success: true,
      message: "Entry updated",
      operation,
    });
  } catch (error: any) {
    console.error("PUT /api/accounts/[sno] error:", error);

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update entry" },
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
        { success: false, message: "Only a super admin can delete accounts entries" },
        { status: 403 },
      );
    }

    const sno = parseSno((await params).sno);

    if (sno === null) {
      return NextResponse.json(
        { success: false, message: "Invalid entry S.No" },
        { status: 400 },
      );
    }

    const book = getAccountBook(req.nextUrl.searchParams.get("book"));

    if (!book) {
      return NextResponse.json(
        { success: false, message: "Unknown account book" },
        { status: 400 },
      );
    }

    const client = await getMongoClient();
    const result = await client
      .db(DB_NAME)
      .collection(book.collection)
      .deleteOne({ sno });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Entry not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Entry deleted",
    });
  } catch (error: any) {
    console.error("DELETE /api/accounts/[sno] error:", error);

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete entry" },
      { status: 500 },
    );
  }
}
