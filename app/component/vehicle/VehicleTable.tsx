"use client";

import { useEffect, useMemo, useState } from "react";
import CommonTable, { TableColumn } from "../common/CommonTable";
import SearchInput from "../common/SearchInput";
import { Vehicle } from "../../types/vehicle";
import VehicleDetailsModal from "./VehicleDetailsModal";
import EditVehicleModal from "./EditVehicleModal";
import { useVehicleStats } from "@/app/hooks/useVehicleStats";
import StatCard from "../common/StatCard";
import { useLoadingSlipSentVehicles } from "@/app/hooks/useLoadingSlipSentVehicles";
import VehicleStatusCard from "../common/VehicleStatusCard";
import { useEtpInvoiceDoneVehicles } from "@/app/hooks/useEtpInvoiceDoneVehicles";

export default function VehicleTable() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [viewVehicle, setViewVehicle] = useState<Vehicle | null>(null);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  const loadingSlipSentVehicles = useLoadingSlipSentVehicles(vehicles);
  const etpInvoiceDoneVehicles = useEtpInvoiceDoneVehicles(vehicles);

  const { todayVehicles, todayDispatchDone, todayWaitingForDetails } =
    useVehicleStats(vehicles);

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
    const searchText = search.toLowerCase().trim();

    return vehicles.filter((vehicle) =>
      [
        vehicle.tokenNo,
        vehicle.vehicleNo,
        vehicle.driverName,
        vehicle.driverContact,
        vehicle.materialName,
        vehicle.destination,
        vehicle.transporterName,
        vehicle.buyerDetails,
        vehicle.status,
        vehicle.sno?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchText),
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
  console.log("loadingSlipSentVehicles", loadingSlipSentVehicles);
  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-3">
          <StatCard title="Today's Vehicles" value={todayVehicles} />
          <StatCard title="Today's Dispatch" value={todayDispatchDone} />
          <StatCard title="Waiting" value={todayWaitingForDetails} />
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {loadingSlipSentVehicles.map((item) => (
            <VehicleStatusCard
              key={item.sno}
              sno={item.sno}
              tokenNo={item.tokenNo}
              vehicleNo={item.vehicleNo}
              status="LOADING_SLIP_SENT"
              onClick={() => setViewVehicle(item)}
            />
          ))}
          {etpInvoiceDoneVehicles.map((item) => (
            <VehicleStatusCard
              key={item.sno}
              sno={item.sno}
              tokenNo={item.tokenNo}
              vehicleNo={item.vehicleNo}
              status={item.status}
              onClick={() => setViewVehicle(item)}
            />
          ))}
        </div>

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
