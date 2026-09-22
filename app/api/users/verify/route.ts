import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          exists: false,
          message: "Email is required",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const client = await clientPromise;

    /*
     * CHANGE THESE IF YOUR DATABASE/COLLECTION
     * NAMES ARE DIFFERENT.
     */

    const db = client.db(process.env.MONGODB_DB || "gomti_infra");

    const usersCollection = db.collection(
      process.env.MONGODB_USERS_COLLECTION || "users",
    );

    const user = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: true,
          exists: false,
          message: "User does not exist",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        exists: true,
        user: {
          id: user._id?.toString(),
          email: user.email,
          name: user.name || user.userName || "",
          role: user.role || "",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("USER VERIFY API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        exists: false,
        message: "Unable to verify user",
      },
      { status: 500 },
    );
  }
}
