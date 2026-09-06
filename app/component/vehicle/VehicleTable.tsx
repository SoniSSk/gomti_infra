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

type DateFilter = "all" | "today" | "7days" | "custom";

export default function VehicleTable() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customDate, setCustomDate] = useState("");

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

  /**
   * Parse vehicle date
   *
   * Supports:
   * 2026-09-06T06:07
   * 2026-09-06T06:07:00
   * 03-06-2026 10:30 AM
   */
  const parseVehicleDate = (dateTime: unknown): Date | null => {
    if (!dateTime) return null;

    const value = String(dateTime).trim();

    // DD-MM-YYYY HH:mm AM/PM
    const customFormat =
      /^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

    const match = value.match(customFormat);

    if (match) {
      const [, day, month, year, hour, minute, ampm] = match;

      let hours = Number(hour);

      if (ampm.toUpperCase() === "PM" && hours !== 12) {
        hours += 12;
      }

      if (ampm.toUpperCase() === "AM" && hours === 12) {
        hours = 0;
      }

      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        hours,
        Number(minute),
      );
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  /**
   * Filter vehicles
   */
  const filteredData = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    const now = new Date();

    // Start of today
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // Start of last 7 days
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(todayStart.getDate() - 6);

    // End of today
    const tomorrowStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    return vehicles.filter((vehicle) => {
      const vehicleDate = parseVehicleDate(vehicle.dateTime);

      let matchesDate = true;

      /*
       * TODAY
       */
      if (dateFilter === "today") {
        matchesDate = vehicleDate
          ? isSameDay(vehicleDate, now)
          : false;
      }

      /*
       * LAST 7 DAYS
       */
      if (dateFilter === "7days") {
        matchesDate = vehicleDate
          ? vehicleDate >= sevenDaysAgo &&
          vehicleDate < tomorrowStart
          : false;
      }

      /*
       * CUSTOM DATE
       */
      if (dateFilter === "custom") {
        if (!customDate) {
          matchesDate = true;
        } else {
          const selectedDate = new Date(
            `${customDate}T00:00:00`,
          );

          matchesDate = vehicleDate
            ? isSameDay(vehicleDate, selectedDate)
            : false;
        }
      }

      /*
       * ALL DATES
       */
      if (dateFilter === "all") {
        matchesDate = true;
      }

      /*
       * SEARCH
       */
      const matchesSearch = [
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
        .includes(searchText);

      return matchesDate && matchesSearch;
    });
  }, [vehicles, search, dateFilter, customDate]);

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
      key: "transporterName",
      label: "Transporter Name",
    },

    {
      key: "buyerDetails",
      label: "Buyer Name",
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
          WAITING_FOR_DETAILS:
            "bg-gray-100 text-gray-700",

          ENTRY_DONE:
            "bg-blue-100 text-blue-700",

          WAITING_FOR_TOKEN:
            "bg-yellow-100 text-yellow-700",

          LOADING_STARTED:
            "bg-orange-100 text-orange-700",

          LOADING_DONE:
            "bg-purple-100 text-purple-700",

          LOADING_SLIP_SENT:
            "bg-indigo-100 text-indigo-700",

          ETP_INVOICE_DONE:
            "bg-cyan-100 text-cyan-700",

          DISPATCH_DONE:
            "bg-green-100 text-green-700",
        };

        return (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[row.status] ||
              "bg-gray-100 text-gray-700"
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
            className="cursor-pointer rounded-lg bg-blue-500 px-3 py-1 text-sm text-white transition hover:bg-blue-600"
          >
            View
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditVehicle(row);
            }}
            className="cursor-pointer rounded-lg bg-green-500 px-3 py-1 text-sm text-white transition hover:bg-green-600"
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

        {/* =========================
            STAT CARDS
        ========================== */}
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-3">
          <StatCard
            title="Today's Vehicles"
            value={todayVehicles}
          />

          <StatCard
            title="Today's Dispatch"
            value={todayDispatchDone}
          />

          <StatCard
            title="Waiting"
            value={todayWaitingForDetails}
          />
        </div>

        {/* =========================
            STATUS CARDS
        ========================== */}
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

        {/* =========================
            FILTER + SEARCH
        ========================== */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          {/* FILTER AREA */}
          <div className="flex flex-wrap items-center gap-2">

            {/* REFRESH */}
            <button
              onClick={loadVehicles}
              className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-white transition hover:bg-orange-600"
            >
              Refresh
            </button>

            {/* DATE FILTER FIELD */}
            <div className="relative">

              <select
                value={dateFilter}
                onChange={(e) => {
                  const value =
                    e.target.value as DateFilter;

                  setDateFilter(value);

                  if (value !== "custom") {
                    setCustomDate("");
                  }
                }}
                className="h-10 min-w-[160px] cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition hover:border-orange-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              >
                <option value="today">
                  Today
                </option>

                <option value="7days">
                  Last 7 Days
                </option>

                <option value="custom">
                  Custom Date
                </option>

                <option value="all">
                  All Dates
                </option>
              </select>

              {/* DROPDOWN ICON */}
              <div
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                ▼
              </div>

            </div>

            {/* CUSTOM DATE FIELD */}
            {dateFilter === "custom" && (
              <div className="relative">

                <input
                  type="date"
                  value={customDate}
                  onChange={(e) =>
                    setCustomDate(e.target.value)
                  }
                  className="h-10 cursor-pointer rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition hover:border-orange-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />

              </div>
            )}

          </div>

          {/* SEARCH */}
          <div className="w-full md:w-80">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search Vehicle..."
            />
          </div>

        </div>

        {/* =========================
            TABLE
        ========================== */}
        <CommonTable<Vehicle>
          columns={columns}
          data={filteredData}
          loading={loading}
          onRowClick={() => { }}
        />

      </div>

      {/* =========================
          VIEW MODAL
      ========================== */}
      <VehicleDetailsModal
        vehicle={viewVehicle}
        onClose={() => setViewVehicle(null)}
      />

      {/* =========================
          EDIT MODAL
      ========================== */}
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