"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Routes() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userEmail =
      localStorage.getItem("userEmail");

    const isLoggedIn =
      Boolean(userEmail);

    /* =========================================
       USER NOT LOGGED IN
       Allow only /login
    ========================================= */

    if (
      !isLoggedIn &&
      pathname !== "/login"
    ) {
      router.replace("/login");
      return;
    }

    /* =========================================
       USER ALREADY LOGGED IN
       Don't allow /login
    ========================================= */

    if (
      isLoggedIn &&
      pathname === "/login"
    ) {
      router.replace("/dashboard");
      return;
    }
  }, [pathname, router]);

  return null;
}