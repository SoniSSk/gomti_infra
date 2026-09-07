/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import VehicleTable from "./vehicle/VehicleTable";
import VehicleForm from "./vehicle/VehicleForm";
import LogoutButton from "./common/Logout";

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role?.trim().toLowerCase() || null);
  }, []);

  // Add Details is allowed only for Admin and Employee
  const canAddDetails =
    userRole === "admin" ||
    userRole === "employee";

  return (
    <div className="p-6">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Dispatch List
        </h1>

        <div className="flex items-center gap-3">

          {/* Add Details
              Only Admin + Employee */}
          {canAddDetails && (
            <button
              onClick={() => setShowForm(true)}
              className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition hover:bg-orange-600"
            >
              Add Details
            </button>
          )}

          <LogoutButton />
        </div>
      </div>

      {/* Vehicle Table */}
      <VehicleTable />

      {/* Add Details Modal */}
      {showForm && canAddDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">

            {/* Close Button */}
            <button
              onClick={() => setShowForm(false)}
              className="absolute right-4 top-4 cursor-pointer rounded-lg px-3 py-2 text-lg text-gray-500 hover:bg-gray-100"
            >
              ✕
            </button>

            <VehicleForm
              onSuccess={() => {
                setShowForm(false);

                // Refresh table after adding details
                window.location.reload();
              }}
            />

          </div>
        </div>
      )}
    </div>
  );
}