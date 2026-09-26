import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UAParser } from "ua-parser-js";
import clientPromise from "@/app/lib/mongodb";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        latitude: {},
        longitude: {},
      },
      async authorize(credentials, request) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const client = await clientPromise;
        const db = client.db("gomti_infra");
        const normalizedEmail = email.trim().toLowerCase();

        const user = await db.collection("users").findOne({
          email: normalizedEmail,
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return null;
        }

        // ---- login logging (moved from the old /api/auth/login route) ----
        const loginAt = new Date();

        const forwardedFor = request.headers.get("x-forwarded-for");
        const ipAddress =
          forwardedFor?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          "unknown";

        const userAgent = request.headers.get("user-agent") || "";
        const parser = new UAParser(userAgent);
        const device = parser.getDevice();
        const browser = parser.getBrowser();
        const os = parser.getOS();

        let deviceType = "desktop";
        if (device.type === "mobile") deviceType = "mobile";
        else if (device.type === "tablet") deviceType = "tablet";

        const latitude = Number(credentials?.latitude);
        const longitude = Number(credentials?.longitude);
        const location =
          Number.isFinite(latitude) && Number.isFinite(longitude)
            ? { latitude, longitude }
            : null;

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

        await db.collection("users").updateOne(
          { _id: user._id },
          {
            $set: {
              lastLoginAt: loginAt,
              lastLoginIp: ipAddress,
              lastLoginDevice: deviceType,
              lastLoginLocation: location,
            },
          },
        );

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
