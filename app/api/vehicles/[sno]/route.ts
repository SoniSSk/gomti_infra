import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "../../../lib/mongodb";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sno: string }> }
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
      }
    );

    return NextResponse.json({
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// export async function PUT(
//   req: NextRequest,
//   { params }: { params: Promise<{ sno: string }> }
// ) {
//   try {
//     const { sno } = await params;
//     const body = await req.json();

//     const client = await clientPromise;
//     const db = client.db("gomti_infra");

//     const result = await db.collection("vehicles").updateOne(
//       { sno: Number(sno) },
//       {
//         $set: {
//           ...body,
//           updatedAt: new Date(),
//         },
//       }
//     );

//     if (result.matchedCount === 0) {
//       return NextResponse.json(
//         { success: false, message: "Vehicle not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Vehicle updated successfully",
//     });
//   } catch (error: any) {
//     return NextResponse.json(
//       {
//         success: false,
//         message: error.message,
//       },
//       { status: 500 }
//     );
//   }
// }
// DELETE VEHICLE
export async function DELETE(req: NextRequest) {
  try {
    const { sno } = await req.json();

    const client = await clientPromise;
    const db = client.db("gomti_infra");

    const result = await db.collection("vehicles").deleteOne({
      sno: Number(sno),
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete vehicle",
      },
      {
        status: 500,
      },
    );
  }
}
