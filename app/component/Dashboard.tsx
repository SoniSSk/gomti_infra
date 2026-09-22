"use client";

import React from "react";

import CommonHeader from "./vehicle_new/common/CommonHeader";
import VehicleTables from "./vehicle_new/vehicle /VehicleTable";

const Dashboard = () => {
  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");

    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <CommonHeader
        title="Dashboard"
        subtitle="Vehicle & Dispatch Management"
        userName={
          typeof window !== "undefined"
            ? localStorage.getItem("userName") || ""
            : ""
        }
        onLogout={handleLogout}
      />

      <main className="p-4">
        <VehicleTables />
      </main>

    </div>
  );
};

export default Dashboard;