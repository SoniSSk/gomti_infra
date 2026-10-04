import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { ACCOUNT_BOOKS, getAccountBook } from "./app/types/accounts";
import { canManageUsers } from "./app/utils/vehiclePermissions";
import {
  LAB_DASHBOARD,
  MINING_DASHBOARD,
  VEHICLES_DASHBOARD,
  accountsDashboardKey,
} from "./app/constant/dashboards";
import { getSessionDashboards } from "./app/lib/users";

// authConfig has no providers, so this only decodes the session
// cookie. Granted dashboards are read from MongoDB below, and only
// for module routes.
const { auth } = NextAuth(authConfig);

const isPathOrChild = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

/** Dashboard a route belongs to, or null if it isn't granted per user. */
const getRouteDashboard = (
  pathname: string,
  searchParams: URLSearchParams,
): string | null => {
  if (isPathOrChild(pathname, "/lab") || isPathOrChild(pathname, "/api/lab")) {
    return LAB_DASHBOARD;
  }

  if (
    isPathOrChild(pathname, "/mining") ||
    isPathOrChild(pathname, "/api/mining")
  ) {
    return MINING_DASHBOARD;
  }

  const book = Object.values(ACCOUNT_BOOKS).find(({ path }) =>
    isPathOrChild(pathname, path),
  );

  if (book) {
    return accountsDashboardKey(book.key);
  }

  // Every accounts API call names its book; the route rejects unknown ones
  if (isPathOrChild(pathname, "/api/accounts")) {
    const apiBook = getAccountBook(searchParams.get("book"));
    return apiBook ? accountsDashboardKey(apiBook.key) : null;
  }

  if (
    pathname.startsWith("/dispatch/") ||
    isPathOrChild(pathname, "/api/vehicles") ||
    pathname.startsWith("/api/google-chat/vehicle")
  ) {
    return VEHICLES_DASHBOARD;
  }

  return null;
};

export default auth(async (req) => {
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

  // /api/users/verify stays open to every signed-in user.
  const isUsersRoute =
    isPathOrChild(pathname, "/users") ||
    pathname === "/api/users" ||
    (pathname.startsWith("/api/users/") && pathname !== "/api/users/verify");

  const isUsersForbidden =
    isLoggedIn && isUsersRoute && !canManageUsers(req.auth?.user?.role);

  const routeDashboard = getRouteDashboard(pathname, req.nextUrl.searchParams);

  const isDashboardForbidden =
    isLoggedIn &&
    !!routeDashboard &&
    !(await getSessionDashboards(req.auth?.user)).includes(routeDashboard);

  const isForbidden = isUsersForbidden || isDashboardForbidden;

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
