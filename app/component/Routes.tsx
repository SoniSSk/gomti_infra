"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Routes() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    // If user is not logged in, allow only login page
    if (!isLoggedIn && pathname !== "/login") {
      router.replace("/login");
    }

    // If user is already logged in, don't allow login page
    if (isLoggedIn && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  return null;
}
