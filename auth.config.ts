import type { NextAuthConfig } from "next-auth";

/** Hard session limit, counted from login (activity does not extend it). */
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

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
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.buyer = user.buyer;
        token.loginAt = Date.now();
      }

      // Tokens issued before loginAt existed start their 8 hours now.
      const loginAt =
        typeof token.loginAt === "number" ? token.loginAt : Date.now();
      token.loginAt = loginAt;

      // Auth.js re-signs the JWT on every session read, which would slide
      // maxAge forever. Returning null clears the cookie once the absolute
      // limit since login has passed.
      if (Date.now() - loginAt >= SESSION_MAX_AGE_SECONDS * 1000) {
        return null;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.buyer = token.buyer as string | undefined;
      }
      session.expiresAt = new Date(
        (token.loginAt as number) + SESSION_MAX_AGE_SECONDS * 1000,
      ).toISOString();
      return session;
    },
  },
} satisfies NextAuthConfig;
