"use client";

import React, { useCallback, useEffect, useState } from "react";

import CommonHeader from "./vehicle_new/common/CommonHeader";
import VehicleTables from "./vehicle_new/vehicle /VehicleTable";

const Dashboard = () => {
  const [userName, setUserName] = useState("");
  const [checkingUser, setCheckingUser] = useState(true);

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = useCallback(() => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");

    window.location.href = "/login";
  }, []);

  /* =====================================================
     VERIFY USER
  ===================================================== */

  useEffect(() => {
    let isMounted = true;

    const verifyUser = async () => {
      try {
        const email = localStorage.getItem("userEmail");

        /*
         * If there is no email in localStorage,
         * user is not logged in.
         */

        if (!email) {
          handleLogout();
          return;
        }

        /*
         * Get current local user information
         */

        const localName =
          localStorage.getItem("userName") || "";

        if (isMounted) {
          setUserName(localName);
        }

        /*
         * Verify user against MongoDB
         */

        const response = await fetch(
          `/api/users/verify?email=${encodeURIComponent(email)}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        /*
         * API/server error
         */

        if (!response.ok) {
          console.error(
            "User verification API failed:",
            response.status
          );

          handleLogout();
          return;
        }

        const data = await response.json();

        console.log("USER VERIFY RESPONSE:", data);

        /*
         * User does not exist in database
         */

        if (!data?.success || !data?.exists || !data?.user) {
          console.warn(
            "User does not exist in database. Logging out."
          );

          handleLogout();
          return;
        }

        /*
         * User exists.
         *
         * Optionally update localStorage with the
         * latest database information.
         */

        if (data.user.name) {
          localStorage.setItem(
            "userName",
            data.user.name
          );

          if (isMounted) {
            setUserName(data.user.name);
          }
        }

        if (data.user.role) {
          localStorage.setItem(
            "userRole",
            data.user.role
          );
        }

        /*
         * Verification successful
         */

        if (isMounted) {
          setCheckingUser(false);
        }
      } catch (error) {
        console.error(
          "USER VERIFICATION ERROR:",
          error
        );

        /*
         * If verification cannot be completed,
         * logout the user.
         */

        handleLogout();
      }
    };

    verifyUser();

    return () => {
      isMounted = false;
    };
  }, [handleLogout]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (checkingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin" />

          <p className="mt-4 text-sm text-gray-600">
            Verifying user...
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (
    <div className="min-h-screen bg-gray-50">
      <CommonHeader
        title="Dashboard"
        subtitle="Vehicle & Dispatch Management"
        userName={userName}
        onLogout={handleLogout}
      />

      <main className="p-4">
        <VehicleTables />
      </main>
    </div>
  );
};

export default Dashboard;