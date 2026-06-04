import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "../../lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("gomti_infra");

    const vehicles = await db
      .collection("vehicles")
      .find({})
      .sort({ sno: -1 })
      .toArray();

    return NextResponse.json(vehicles, { status: 200 });
  } catch (error) {
    console.error("GET Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("gomti_infra");

    const result = await db.collection("vehicles").insertOne({
      ...body,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        insertedId: result.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save vehicle" },
      { status: 500 }
    );
  }
}

