import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe config (no DB/bcrypt access) shared by middleware and the
 * full auth.ts. Middleware only needs to decode the session cookie, so
 * it must never import providers that touch MongoDB.
 */
export const authConfig = {
  // Required when self-hosting behind a reverse proxy / non-standard port,
  // since Auth.js otherwise rejects the incoming Host header.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
