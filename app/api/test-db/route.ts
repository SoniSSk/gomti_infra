import { connectDB } from "../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const conn = await connectDB();

    return NextResponse.json({
      success: true,
      message: "MongoDB Connected Successfully",
      database: conn.connection.name,
      host: conn.connection.host,
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