import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      /** Buyer a "customer" role is limited to. */
      buyer?: string;
    } & DefaultSession["user"];
    /** Absolute logout time (loginAt + 8h), unlike the sliding `expires`. */
    expiresAt?: string;
  }

  interface User {
    role?: string;
    buyer?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    buyer?: string;
    /** Epoch ms of login; the session ends 8h after this. */
    loginAt?: number;
  }
}
