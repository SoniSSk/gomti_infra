"use client";

import { useEffect, useMemo, useState } from "react";
import CommonTable, { TableColumn } from "../common/CommonTable";
import SearchInput from "../common/SearchInput";
import { Vehicle } from "../../types/vehicle";
import VehicleDetailsModal from "./VehicleDetailsModal";
import EditVehicleModal from "./EditVehicleModal";

export default function VehicleTable() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [viewVehicle, setViewVehicle] = useState<Vehicle | null>(null);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  const loadVehicles = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/vehicles");

      if (!response.ok) {
        throw new Error("Failed to fetch vehicles");
      }

      const data = await response.json();

      setVehicles(data);
    } catch (error) {
      console.error("Vehicle Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadVehicles();
  }, []);

  const filteredData = useMemo(() => {
    return vehicles.filter((vehicle) =>
      [
        vehicle.vehicleNo,
        vehicle.driverName,
        vehicle.driverContact,
        vehicle.materialName,
        vehicle.destination,
        vehicle.transporterName,
        vehicle.buyerDetails,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [vehicles, search]);

  const handleViewDetails = (vehicle: Vehicle) => {
    setViewVehicle(vehicle);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditVehicle(vehicle);
  };

  const columns: TableColumn<Vehicle>[] = [
    {
      key: "sno",
      label: "S.No",
    },
    {
      key: "tokenNo",
      label: "Token No",
    },
    {
      key: "dateTime",
      label: "Date & Time",
    },
    {
      key: "vehicleNo",
      label: "Vehicle No",
    },
    {
      key: "driverName",
      label: "Driver Name",
    },
    {
      key: "driverContact",
      label: "Mobile No",
    },
    {
      key: "materialName",
      label: "Material",
    },
    {
      key: "netWeight",
      label: "Weight (MT)",
    },

    {
      key: "status",
      label: "Status",
      render: (row) => {
        const statusStyles: Record<string, string> = {
          WAITING_FOR_DETAILS: "bg-gray-100 text-gray-700",
          ENTRY_DONE: "bg-blue-100 text-blue-700",
          WAITING_FOR_TOKEN: "bg-yellow-100 text-yellow-700",
          LOADING_STARTED: "bg-orange-100 text-orange-700",
          LOADING_DONE: "bg-purple-100 text-purple-700",
          LOADING_SLIP_SENT: "bg-indigo-100 text-indigo-700",
          ETP_INVOICE_DONE: "bg-cyan-100 text-cyan-700",
          DISPATCH_DONE: "bg-green-100 text-green-700",
        };

        return (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusStyles[row.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {row.status?.replaceAll("_", " ")}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(row);
            }}
            className="rounded-lg cursor-pointer bg-blue-500 px-3 py-1 text-sm text-white transition hover:bg-blue-600"
          >
            View
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditVehicle(row);
            }}
            className="rounded-lg cursor-pointer bg-green-500 px-3 py-1 text-sm text-white transition hover:bg-green-600"
          >
            Edit
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            onClick={loadVehicles}
            className="rounded-lg  cursor-pointer bg-orange-500 px-4 py-2 text-white transition hover:bg-orange-600"
          >
            Refresh
          </button>

          <div className="w-full md:w-80">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search Vehicle..."
            />
          </div>
        </div>

        <CommonTable<Vehicle>
          columns={columns}
          data={filteredData}
          loading={loading}
          onRowClick={() => {}}
        />
      </div>

      {/* View Modal */}
      <VehicleDetailsModal
        vehicle={viewVehicle}
        onClose={() => setViewVehicle(null)}
      />

      {/* Edit Modal */}
      <EditVehicleModal
        vehicle={editVehicle}
        onClose={() => setEditVehicle(null)}
        onSuccess={() => {
          setEditVehicle(null);
          loadVehicles();
        }}
      />
    </>
  );
}
