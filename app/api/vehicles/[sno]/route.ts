/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sno: string }> },
) {
  try {
    const { sno } = await params;
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("gomti_infra");

    const result = await db.collection("vehicles").updateOne(
      {
        sno: Number(sno),
      },
      {
        $set: {
          ...body,
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

    return NextResponse.json({
      success: true,
      message: "Vehicle updated successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error("PUT vehicle error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update vehicle",
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
