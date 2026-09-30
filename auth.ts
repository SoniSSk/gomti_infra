import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UAParser } from "ua-parser-js";
import getMongoClient from "@/app/lib/mongodb";
import { authConfig } from "./auth.config";
import { INACTIVE_USER_CODE, isUserActive } from "@/app/types/user";

/* Lets the login page tell a deactivated account from a wrong password. */
class InactiveUserError extends CredentialsSignin {
  code = INACTIVE_USER_CODE;
}

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
          console.warn(
            "[authorize] missing/invalid email or password field on credentials",
          );
          return null;
        }

        const client = await getMongoClient();
        const db = client.db("gomti_infra");
        const normalizedEmail = email.trim().toLowerCase();

        const user = await db.collection("users").findOne({
          email: normalizedEmail,
        });

        console.log(
          `[authorize] lookup email="${normalizedEmail}" found=${!!user} hasPasswordField=${typeof user?.password === "string"} status=${user?.status} role=${user?.role}`,
        );

        if (!user) {
          console.warn("[authorize] no user found for that email");
          return null;
        }

        if (typeof user.password !== "string") {
          console.warn(
            "[authorize] user document has no string 'password' field, cannot compare",
          );
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        console.log(`[authorize] passwordMatch=${passwordMatch}`);

        if (!passwordMatch) {
          return null;
        }

        // Checked after the password so it doesn't reveal which emails exist
        if (!isUserActive(user.active)) {
          console.warn("[authorize] user is deactivated");
          throw new InactiveUserError();
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
          buyer: typeof user.buyer === "string" ? user.buyer : undefined,
        };
      },
    }),
  ],
});
