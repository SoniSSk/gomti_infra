import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "../../../lib/mongodb";

const ALLOWED_ROLES = [
  "admin",
  "employee",
  "welspun",
  "shreecement",
  "evonith",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, email, password, role } = body;

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, password and role are required",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const normalizedName = name.trim();

    // -----------------------------
    // ROLE VALIDATION
    // -----------------------------

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid role",
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // PASSWORD VALIDATION
    // -----------------------------

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters",
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // DATABASE
    // -----------------------------

    const client = await clientPromise;

    const db = client.db("gomti_infra");

    const usersCollection = db.collection("users");

    // -----------------------------
    // CHECK EXISTING USER
    // -----------------------------

    const existingUser = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "This email is already registered",
        },
        { status: 409 },
      );
    }

    // -----------------------------
    // HASH PASSWORD
    // -----------------------------

    const hashedPassword = await bcrypt.hash(password, 12);

    // -----------------------------
    // CREATE USER
    // -----------------------------

    const createdAt = new Date();

    const newUser = {
      name: normalizedName,

      email: normalizedEmail,

      password: hashedPassword,

      role,

      createdAt,

      lastLoginAt: null,

      lastLoginIp: null,

      lastLoginDevice: null,

      lastLoginLocation: null,

      passwordUpdatedAt: null,
    };

    const result = await usersCollection.insertOne(newUser);

    // -----------------------------
    // RESPONSE
    // -----------------------------

    return NextResponse.json(
      {
        success: true,

        message: "Account created successfully",

        user: {
          id: result.insertedId.toString(),

          name: normalizedName,

          email: normalizedEmail,

          role,

          createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
