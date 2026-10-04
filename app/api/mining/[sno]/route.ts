/* eslint-disable @typescript-eslint/no-explicit-any */
import getMongoClient from "@/app/lib/mongodb";
import { auth } from "@/auth";
import { canOpenDashboard } from "@/app/lib/users";
import { MINING_DASHBOARD } from "@/app/constant/dashboards";
import { isSuperAdminRole } from "@/app/utils/vehiclePermissions";
import { validateMining, type MiningInput } from "@/app/types/mining";
import { buildMiningFields } from "@/app/lib/mining";
import { NextRequest, NextResponse } from "next/server";

const DB_NAME = "gomti_infra";
const COLLECTION = "mining";

const toComparable = (value: unknown) =>
  value instanceof Date ? value.toISOString() : JSON.stringify(value ?? null);

const parseSno = async (params: Promise<{ sno: string }>) => {
  const { sno } = await params;
  const value = Number(sno);

  return Number.isFinite(value) ? value : null;
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sno: string }> },
) {
  try {
    const session = await auth();

    if (!(await canOpenDashboard(session?.user, MINING_DASHBOARD))) {
      return NextResponse.json(
        { success: false, message: "You don't have permission to edit mining trips" },
        { status: 403 },
      );
    }

    const tripSno = await parseSno(params);

    if (tripSno === null) {
      return NextResponse.json(
        { success: false, message: "Invalid trip S.No" },
        { status: 400 },
      );
    }

    const body: MiningInput = await req.json().catch(() => null);

    const problem = validateMining(body);

    if (problem) {
      return NextResponse.json({ success: false, message: problem }, { status: 400 });
    }

    const client = await getMongoClient();
    const collection = client.db(DB_NAME).collection(COLLECTION);

    const existing: any = await collection.findOne({ sno: tripSno });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Mining trip not found" },
        { status: 404 },
      );
    }

    const userName = session?.user?.name ?? session?.user?.email ?? "";
    const now = new Date();

    const updates: Record<string, unknown> = {};
    const unset: Record<string, ""> = {};

    for (const [field, value] of Object.entries(
      buildMiningFields(body, userName, now, existing),
    )) {
      // Cleared optional fields are removed rather than stored empty
      if (value === undefined || value === "") {
        if (existing[field] !== undefined) unset[field] = "";
        continue;
      }

      if (toComparable(value) !== toComparable(existing[field])) {
        updates[field] = value;
      }
    }

    const changedFields = [...Object.keys(updates), ...Object.keys(unset)];

    if (!changedFields.length) {
      return NextResponse.json({
        success: true,
        message: "No changes to save",
        trip: existing,
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
      { sno: tripSno },
      {
        $set: { ...updates, updatedAt: now, updatedBy: userName },
        ...(Object.keys(unset).length && { $unset: unset }),
        $push: { updateHistory: { $each: history } } as any,
      },
    );

    const trip = await collection.findOne({ sno: tripSno });

    return NextResponse.json({
      success: true,
      message: "Trip updated",
      trip,
    });
  } catch (error: any) {
    console.error("PUT /api/mining/[sno] error:", error);

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update mining trip" },
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
        { success: false, message: "Only a super admin can delete mining trips" },
        { status: 403 },
      );
    }

    const tripSno = await parseSno(params);

    if (tripSno === null) {
      return NextResponse.json(
        { success: false, message: "Invalid trip S.No" },
        { status: 400 },
      );
    }

    const client = await getMongoClient();
    const result = await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .deleteOne({ sno: tripSno });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Mining trip not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Trip deleted",
    });
  } catch (error: any) {
    console.error("DELETE /api/mining/[sno] error:", error);

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete mining trip" },
      { status: 500 },
    );
  }
}
