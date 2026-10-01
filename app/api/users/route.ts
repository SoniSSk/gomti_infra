/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import getMongoClient from "@/app/lib/mongodb";
import { auth } from "@/auth";
import { canManageUsers } from "@/app/utils/vehiclePermissions";
import { MIN_PASSWORD_LENGTH, toUserRole } from "@/app/types/user";
import {
  USERS_COLLECTION,
  USERS_DB,
  USER_PROJECTION,
  forbiddenUsersResponse,
  toUserResponse,
} from "@/app/lib/users";

export async function GET() {
  try {
    const session = await auth();

    if (!canManageUsers(session?.user?.role)) {
      return forbiddenUsersResponse();
    }

    const client = await getMongoClient();
    const users = await client
      .db(USERS_DB)
      .collection(USERS_COLLECTION)
      .find({}, { projection: USER_PROJECTION })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      users: users.map(toUserResponse),
    });
  } catch (error: any) {
    console.error("GET /api/users error:", error);

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load users" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!canManageUsers(session?.user?.role)) {
      return forbiddenUsersResponse();
    }

    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = toUserRole(body.role);
    const buyer =
      role === "customer" && typeof body.buyer === "string"
        ? body.buyer.trim()
        : "";

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Name, email, password and role are required" },
        { status: 400 },
      );
    }

    if (role === "customer" && !buyer) {
      return NextResponse.json(
        { success: false, message: "Buyer is required for a customer" },
        { status: 400 },
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        },
        { status: 400 },
      );
    }

    const client = await getMongoClient();
    const collection = client.db(USERS_DB).collection(USERS_COLLECTION);

    if (await collection.findOne({ email })) {
      return NextResponse.json(
        { success: false, message: "This email is already registered" },
        { status: 409 },
      );
    }

    const now = new Date();

    const newUser = {
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role,
      ...(buyer && { buyer }),
      active: body.active !== false,
      createdAt: now,
      createdBy: session?.user?.name ?? session?.user?.email ?? "",
      lastLoginAt: null,
      lastLoginIp: null,
      lastLoginDevice: null,
      lastLoginLocation: null,
      passwordUpdatedAt: null,
    };

    const { insertedId } = await collection.insertOne(newUser);

    return NextResponse.json(
      {
        success: true,
        message: "User created",
        user: {
          id: insertedId.toString(),
          name,
          email,
          role,
          ...(buyer && { buyer }),
          active: body.active !== false,
          createdAt: now,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST /api/users error:", error);

    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create user" },
      { status: 500 },
    );
  }
}
