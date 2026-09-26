/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  canModifyVehicle,
  isReadOnlyRole,
} from "@/app/utils/vehiclePermissions";
import clientPromise from "../../../lib/mongodb";

/** Customers can only view vehicles, never change them. */
async function rejectIfCustomer() {
  const session = await auth();

  if (!isReadOnlyRole(session?.user?.role)) {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      message: "You don't have permission to modify vehicles",
    },
    { status: 403 },
  );
}

/** Dispatched vehicles can only be changed by a super admin. */
async function rejectIfLocked(db: any, vehicleSno: number) {
  const existing = await db
    .collection("vehicles")
    .findOne({ sno: vehicleSno }, { projection: { status: 1 } });

  if (!existing) {
    return null;
  }

  const session = await auth();

  if (canModifyVehicle(existing.status, session?.user?.role)) {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      message: "Only a super admin can modify a dispatched vehicle",
    },
    { status: 403 },
  );
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sno: string }> },
) {
  try {
    const forbidden = await rejectIfCustomer();
    if (forbidden) {
      return forbidden;
    }

    const { sno } = await params;
    const body = await req.json();

    const vehicleSno = Number(sno);

    if (!Number.isFinite(vehicleSno)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid vehicle S.No",
        },
        { status: 400 },
      );
    }

    /*
     * IMPORTANT
     * ---------------------------------------------------------
     * MongoDB _id is immutable.
     *
     * The frontend sends the complete Vehicle_new object,
     * including _id. We must NOT pass _id into $set.
     *
     * sno is also used to identify the vehicle, so it is
     * protected from modification here as well.
     *
     * createdAt is dropped too: the client sends it back as an
     * ISO string, which would replace the stored Date.
     */
    const {
      _id,
      sno: bodySno,
      createdAt: _createdAt,
      ...updateData
    } = body;

    const client = await clientPromise;
    const db = client.db("gomti_infra");

    const locked = await rejectIfLocked(db, vehicleSno);
    if (locked) {
      return locked;
    }

    const result = await db.collection("vehicles").updateOne(
      {
        sno: vehicleSno,
      },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Vehicle not found",
        },
        { status: 404 },
      );
    }

    /*
     * Fetch the saved document so the frontend receives the
     * actual MongoDB object, including the real updatedAt.
     */
    const updatedVehicle = await db.collection("vehicles").findOne({
      sno: vehicleSno,
    });

    return NextResponse.json({
      success: true,
      message: "Vehicle updated successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      vehicle: updatedVehicle,
    });
  } catch (error: any) {
    console.error("❌ PUT vehicle error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to update vehicle",
      },
      { status: 500 },
    );
  }
}

// DELETE VEHICLE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sno: string }> },
) {
  try {
    const forbidden = await rejectIfCustomer();
    if (forbidden) {
      return forbidden;
    }

    const { sno } = await params;

    const vehicleSno = Number(sno);

    if (Number.isNaN(vehicleSno)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid vehicle sno",
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("gomti_infra");

    const locked = await rejectIfLocked(db, vehicleSno);
    if (locked) {
      return locked;
    }

    const result = await db.collection("vehicles").deleteOne({
      sno: vehicleSno,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Vehicle not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vehicle deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("DELETE vehicle error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete vehicle",
      },
      { status: 500 },
    );
  }
}
