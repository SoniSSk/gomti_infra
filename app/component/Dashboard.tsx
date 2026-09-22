"use client";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import CommonHeader from "./vehicle_new/common/CommonHeader";
import Links from "./dashboard/Links";

/* =====================================================
   CONSTANTS
===================================================== */

const VERIFY_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

const VERIFY_TIMESTAMP_KEY = "userVerifiedAt";

/* =====================================================
   DASHBOARD
===================================================== */

const Dashboard = () => {
  const [userName, setUserName] = useState("");
  const [checkingUser, setCheckingUser] = useState(true);

  /* =====================================================
     CLEAR ALL LOCAL STORAGE + LOGOUT
  ===================================================== */

  const handleLogout = useCallback(() => {
    try {
      /*
       * Clear EVERYTHING from localStorage.
       *
       * This removes:
       * userEmail
       * userName
       * userRole
       * userVerifiedAt
       * any other saved localStorage data
       */

      localStorage.clear();
    } catch (error) {
      console.error(
        "Failed to clear localStorage:",
        error
      );
    }

    /*
     * Redirect to login
     */

    window.location.replace("/login");
  }, []);

  /* =====================================================
     CHECK IF VERIFICATION IS STILL VALID
  ===================================================== */

  const isVerificationValid = useCallback(() => {
    try {
      const verifiedAt =
        localStorage.getItem(
          VERIFY_TIMESTAMP_KEY
        );

      if (!verifiedAt) {
        return false;
      }

      const verifiedTime =
        Number(verifiedAt);

      if (
        !Number.isFinite(
          verifiedTime
        )
      ) {
        return false;
      }

      const currentTime =
        Date.now();

      const elapsedTime =
        currentTime -
        verifiedTime;

      /*
       * Valid for 4 hours
       */

      return (
        elapsedTime <
        VERIFY_INTERVAL
      );
    } catch (error) {
      console.error(
        "Verification timestamp error:",
        error
      );

      return false;
    }
  }, []);

  /* =====================================================
     VERIFY USER
  ===================================================== */

  useEffect(() => {
    let isMounted = true;

    const verifyUser = async () => {
      try {
        /*
         * =================================================
         * GET LOCAL USER
         * =================================================
         */

        const email =
          localStorage.getItem(
            "userEmail"
          );

        /*
         * No email means user is not logged in.
         */

        if (!email) {
          handleLogout();
          return;
        }

        /*
         * =================================================
         * GET LOCAL USER DATA
         * =================================================
         */

        const localName =
          localStorage.getItem(
            "userName"
          ) || "";

        const localRole =
          localStorage.getItem(
            "userRole"
          ) || "";

        /*
         * =================================================
         * CHECK 4-HOUR VERIFICATION
         * =================================================
         *
         * If user was verified within the last
         * 4 hours, DO NOT call the API again.
         */

        if (
          isVerificationValid()
        ) {
          console.log(
            "User already verified within 4 hours."
          );

          if (isMounted) {
            setUserName(
              localName
            );

            setCheckingUser(
              false
            );
          }

          return;
        }

        /*
         * =================================================
         * VERIFY AGAIN
         * =================================================
         */

        console.log(
          "User verification expired. Verifying again..."
        );

        const response =
          await fetch(
            `/api/users/verify?email=${encodeURIComponent(
              email
            )}`,
            {
              method: "GET",
              cache: "no-store",
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        /*
         * =================================================
         * API ERROR
         * =================================================
         */

        if (!response.ok) {
          console.error(
            "User verification API failed:",
            response.status
          );

          handleLogout();
          return;
        }

        const data =
          await response.json();

        console.log(
          "USER VERIFY RESPONSE:",
          data
        );

        /*
         * =================================================
         * USER DOES NOT EXIST
         * =================================================
         */

        if (
          !data?.success ||
          !data?.exists ||
          !data?.user
        ) {
          console.warn(
            "User does not exist in database. Logging out."
          );

          handleLogout();
          return;
        }

        /*
         * =================================================
         * UPDATE USER INFORMATION
         * =================================================
         */

        if (
          data.user.name
        ) {
          localStorage.setItem(
            "userName",
            data.user.name
          );

          if (isMounted) {
            setUserName(
              data.user.name
            );
          }
        } else if (isMounted) {
          setUserName(
            localName
          );
        }

        if (
          data.user.role
        ) {
          localStorage.setItem(
            "userRole",
            data.user.role
          );
        }

        /*
         * =================================================
         * SAVE VERIFICATION TIME
         * =================================================
         *
         * This starts a new 4-hour verification period.
         */

        localStorage.setItem(
          VERIFY_TIMESTAMP_KEY,
          Date.now().toString()
        );

        /*
         * =================================================
         * VERIFICATION SUCCESS
         * =================================================
         */

        if (isMounted) {
          setCheckingUser(
            false
          );
        }
      } catch (error) {
        console.error(
          "USER VERIFICATION ERROR:",
          error
        );

        /*
         * If verification fails,
         * clear storage and login again.
         */

        handleLogout();
      }
    };

    verifyUser();

    return () => {
      isMounted = false;
    };
  }, [
    handleLogout,
    isVerificationValid,
  ]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (checkingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center justify-center">
          <div
            className="
              h-10
              w-10
              animate-spin
              rounded-full
              border-4
              border-gray-300
              border-t-orange-500
            "
          />

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

      <Links />
    </div>
  );
};

export default Dashboard;