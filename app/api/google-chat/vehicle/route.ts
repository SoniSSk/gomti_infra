import { NextRequest, NextResponse } from "next/server";
import { sendGoogleChatVehicleUpdate } from "@/app/lib/googleChat";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Google Chat request:", body);

    const {
      vehicleNumber,
      status,
      transporter,
      driverName,
      driverMobile,
      location,
    } = body;

    if (!vehicleNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Vehicle number is required",
        },
        { status: 400 },
      );
    }

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          message: "Vehicle status is required",
        },
        { status: 400 },
      );
    }

    await sendGoogleChatVehicleUpdate({
      vehicleNumber,
      status,
      transporter,
      driverName,
      driverMobile,
      location,
    });

    return NextResponse.json({
      success: true,
      message: "Message sent to Google Chat",
    });
  } catch (error) {
    console.error("Google Chat API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to send Google Chat message",
      },
      { status: 500 },
    );
  }
}
