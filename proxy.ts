import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Edge-safe: authConfig has no providers, so this only decodes the
// session cookie — it never touches MongoDB.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  console.log(
    `[proxy] ${req.method} ${pathname} isLoggedIn=${isLoggedIn} user=${req.auth?.user?.email ?? "none"}`,
  );

  // NextAuth's own routes (session, csrf, callback/credentials, ...)
  // and the public signup endpoint must stay reachable.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api");

  if (isApiRoute) {
    if (!isLoggedIn) {
      console.log(`[proxy] blocking API route ${pathname} -> 401`);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  const isLoginPage = pathname === "/login";
  const isHomePage = pathname === "/";

  if (!isLoggedIn && !isLoginPage && !isHomePage) {
    console.log(
      `[proxy] not logged in, redirecting ${pathname} -> /login`,
    );
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isLoginPage) {
    console.log(
      `[proxy] already logged in, redirecting /login -> /dispatch/vehicle`,
    );
    return NextResponse.redirect(new URL("/dispatch/vehicle", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
