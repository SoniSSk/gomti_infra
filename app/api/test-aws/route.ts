import { NextResponse } from "next/server";
import {
  ListBucketsCommand,
  Bucket,
} from "@aws-sdk/client-s3";
import { s3Client } from "@/app/lib/aws";

interface SuccessResponse {
  success: true;
  buckets?: Bucket[];
}

interface ErrorResponse {
  success: false;
  error: string;
}

export async function GET() {
  try {
    const result = await s3Client.send(
      new ListBucketsCommand({})
    );

    const response: SuccessResponse = {
      success: true,
      buckets: result.Buckets,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error";

    const response: ErrorResponse = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, {
      status: 500,
    });
  }
}