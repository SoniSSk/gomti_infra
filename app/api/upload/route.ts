import { NextRequest, NextResponse } from "next/server";
import cloudinary from "../../lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await cloudinary.uploader.upload(
      body.image,
      {
        folder: "gomti-infra",
      }
    );

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}