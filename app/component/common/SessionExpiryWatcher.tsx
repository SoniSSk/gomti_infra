"use client";

import { useCallback, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

const PUBLIC_PATHS = ["/", "/login"];
const USER_STORAGE_KEYS = ["userRole", "userName", "userEmail"];

function isAppApiRequest(input: RequestInfo | URL) {
  const raw =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const url = new URL(raw, window.location.origin);

  return (
    url.origin === window.location.origin &&
    url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/api/auth")
  );
}

/**
 * Sends the user to /login when the 8-hour session (see auth.config.ts)
 * ends while a page is open: at the expiry time, when a session refetch
 * comes back empty after expiry, or when any /api call returns 401.
 */
export default function SessionExpiryWatcher() {
  const { data: session, status } = useSession();
  const expiresAtRef = useRef<number | null>(null);
  const loggingOutRef = useRef(false);

  const expireSession = useCallback(() => {
    if (loggingOutRef.current) return;
    if (PUBLIC_PATHS.includes(window.location.pathname)) return;
    loggingOutRef.current = true;

    try {
      USER_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }

    signOut({ redirect: false }).finally(() => {
      window.location.replace("/login?expired=1");
    });
  }, []);

  // Logout exactly at the absolute expiry time.
  useEffect(() => {
    if (!session?.expiresAt) return;

    const expiresAt = Date.parse(session.expiresAt);
    expiresAtRef.current = expiresAt;

    const timeout = window.setTimeout(
      expireSession,
      Math.max(0, expiresAt - Date.now()),
    );

    return () => window.clearTimeout(timeout);
  }, [session?.expiresAt, expireSession]);

  // Timers are throttled in background/sleeping tabs; SessionProvider
  // refetches on focus, so catch the session disappearing after expiry.
  // A manual logout (before expiry) is left to the logout button's own flow.
  useEffect(() => {
    if (
      status === "unauthenticated" &&
      expiresAtRef.current !== null &&
      Date.now() >= expiresAtRef.current
    ) {
      expireSession();
    }
  }, [status, expireSession]);

  // proxy.ts answers any /api call without a valid session with 401.
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401 && isAppApiRequest(args[0])) {
        expireSession();
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [expireSession]);

  return null;
}
