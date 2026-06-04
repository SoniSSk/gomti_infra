"use client";

import { useState } from "react";
import VehicleTable from "./vehicle/VehicleTable";
import VehicleForm from "./vehicle/VehicleForm";
import EditVehicleModal from "./vehicle/EditVehicleModal";

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Dispatch List</h1>

        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
        >
          Add Details
        </button>
      </div>

      <VehicleTable />

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl"
            >
              ✕
            </button>

            <VehicleForm
              onSuccess={() => {
                setShowForm(false);
                window.location.reload(); // refresh table
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
