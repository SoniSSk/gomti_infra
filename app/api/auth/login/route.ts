import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UAParser } from "ua-parser-js";
import clientPromise from "../../../lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { email, password, latitude, longitude } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("gomti_infra");

    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.collection("users").findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      );
    }

    // Login date/time
    const loginAt = new Date();

    // IP address
    const forwardedFor = request.headers.get("x-forwarded-for");

    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // User agent
    const userAgent = request.headers.get("user-agent") || "";

    // Parse device information
    const parser = new UAParser(userAgent);

    const device = parser.getDevice();
    const browser = parser.getBrowser();
    const os = parser.getOS();

    let deviceType = "desktop";

    if (device.type === "mobile") {
      deviceType = "mobile";
    } else if (device.type === "tablet") {
      deviceType = "tablet";
    }

    // Location
    let location = null;

    if (typeof latitude === "number" && typeof longitude === "number") {
      location = {
        latitude,
        longitude,
      };
    }

    // Save login history
    await db.collection("login_logs").insertOne({
      userId: user._id,

      email: user.email,
      name: user.name,
      role: user.role,

      loginAt,

      ipAddress,

      deviceType,

      browser: {
        name: browser.name || "Unknown",
        version: browser.version || "Unknown",
      },

      operatingSystem: {
        name: os.name || "Unknown",
        version: os.version || "Unknown",
      },

      device: {
        vendor: device.vendor || "Unknown",
        model: device.model || "Unknown",
      },

      userAgent,

      location,
    });

    // Update last login
    await db.collection("users").updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          lastLoginAt: loginAt,
          lastLoginIp: ipAddress,
          lastLoginDevice: deviceType,
          lastLoginLocation: location,
        },
      },
    );

    return NextResponse.json({
      success: true,

      message: "Login successful",

      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },

      login: {
        loginAt,
        ipAddress,
        deviceType,
        browser: browser.name || "Unknown",
        os: os.name || "Unknown",
        location,
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
