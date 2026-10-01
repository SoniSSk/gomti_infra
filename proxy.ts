import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import {
  canAccessLab,
  canAccessVehicles,
  canManageUsers,
} from "./app/utils/vehiclePermissions";

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

  const isLabRoute =
    pathname === "/lab" ||
    pathname.startsWith("/lab/") ||
    pathname === "/api/lab" ||
    pathname.startsWith("/api/lab/");

  const isVehiclesRoute =
    pathname.startsWith("/dispatch/") ||
    pathname === "/api/vehicles" ||
    pathname.startsWith("/api/vehicles/") ||
    pathname.startsWith("/api/google-chat/vehicle");

  // /api/users/verify stays open to every signed-in user.
  const isUsersRoute =
    pathname === "/users" ||
    pathname.startsWith("/users/") ||
    pathname === "/api/users" ||
    (pathname.startsWith("/api/users/") && pathname !== "/api/users/verify");

  const isLabForbidden =
    isLoggedIn && isLabRoute && !canAccessLab(req.auth?.user?.role);

  const isUsersForbidden =
    isLoggedIn && isUsersRoute && !canManageUsers(req.auth?.user?.role);

  const isVehiclesForbidden =
    isLoggedIn && isVehiclesRoute && !canAccessVehicles(req.auth?.user?.role);

  const isForbidden = isLabForbidden || isUsersForbidden || isVehiclesForbidden;

  if (isApiRoute) {
    if (!isLoggedIn) {
      console.log(`[proxy] blocking API route ${pathname} -> 401`);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    if (isForbidden) {
      console.log(`[proxy] blocking API route ${pathname} -> 403`);
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }

  if (isForbidden) {
    console.log(
      `[proxy] role=${req.auth?.user?.role} can't open ${pathname}, redirecting -> /dashboard`,
    );
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
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
      `[proxy] already logged in, redirecting /login -> /dashboard`,
    );
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
