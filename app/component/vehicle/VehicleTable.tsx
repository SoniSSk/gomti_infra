/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import CommonTable, {
  TableColumn,
} from "../common/CommonTable";

import SearchInput from "../common/SearchInput";

import { Vehicle } from "../../types/vehicle";

import VehicleDetailsModal from "./VehicleDetailsModal";
import EditVehicleModal from "./EditVehicleModal";

import { useVehicleStats } from "@/app/hooks/useVehicleStats";
import StatCard from "../common/StatCard";

import {
  useLoadingSlipSentVehicles,
} from "@/app/hooks/useLoadingSlipSentVehicles";

import VehicleStatusCard from "../common/VehicleStatusCard";

import {
  useEtpInvoiceDoneVehicles,
} from "@/app/hooks/useEtpInvoiceDoneVehicles";
import { useEtpGeneratingVehicles } from "@/app/hooks/useEtpGeneratingVechiles";
import { useEtpDoneVehicles } from "@/app/hooks/useEtpDoneVechiles";
import { useInvoiceGeneratingVehicle } from "@/app/hooks/useInvoiceGeneratingVechile";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";
import PulseDot from "../common/PulseDot";


type DateFilter =
  | "all"
  | "today"
  | "7days"
  | "custom";

const AUTO_REFRESH_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "30 sec", value: 30_000 },
  { label: "1 min", value: 60_000 },
  { label: "2 min", value: 120_000 },
  { label: "5 min", value: 300_000 },
];

const DEFAULT_AUTO_REFRESH_MS = 60_000;

const AUTO_REFRESH_STORAGE_KEY =
  "vehicleAutoRefreshMs";

// How long new / updated rows stay highlighted
const HIGHLIGHT_MS = 2 * 60_000;

type Highlight = {
  type: "new" | "updated";
  expiresAt: number;
};

// Rows missing from `prev` are new,
// rows with a changed updatedAt are updated
const diffVehicles = (
  prev: Vehicle[],
  next: Vehicle[]
) => {
  const prevById = new Map(
    prev.map((v) => [v._id, v])
  );

  const expiresAt =
    Date.now() + HIGHLIGHT_MS;

  const changes: Record<string, Highlight> = {};

  for (const vehicle of next) {
    const old = prevById.get(vehicle._id);

    if (!old) {
      changes[vehicle._id] = {
        type: "new",
        expiresAt,
      };
    } else if (
      old.updatedAt !== vehicle.updatedAt
    ) {
      changes[vehicle._id] = {
        type: "updated",
        expiresAt,
      };
    }
  }

  return changes;
};

const getToday = () => {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function VehicleTable() {
  // =====================================
  // VEHICLES
  // =====================================

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  // Latest request id, so stale responses
  // (e.g. after a filter change) are ignored
  const requestIdRef = useRef(0);

  const inFlightRef = useRef(false);

  // =====================================
  // CHANGE HIGHLIGHTS
  // =====================================

  const [highlights, setHighlights] =
    useState<Record<string, Highlight>>({});

  // Last loaded list + its query, to diff
  // only between loads of the same filter
  const lastVehiclesRef =
    useRef<Vehicle[]>([]);

  const lastLoadKeyRef =
    useRef<string | null>(null);

  // Drop highlights as they expire
  useEffect(() => {
    const expiries = Object.values(
      highlights
    ).map((h) => h.expiresAt);

    if (!expiries.length) return;

    const timer = setTimeout(() => {
      const now = Date.now();

      setHighlights((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(
            ([, h]) => h.expiresAt > now
          )
        )
      );
    }, Math.max(0, Math.min(...expiries) - Date.now()));

    return () => clearTimeout(timer);
  }, [highlights]);

  // =====================================
  // AUTO REFRESH
  // =====================================

  const [autoRefreshMs, setAutoRefreshMs] =
    useState(DEFAULT_AUTO_REFRESH_MS);

  useEffect(() => {
    const saved = localStorage.getItem(
      AUTO_REFRESH_STORAGE_KEY
    );

    const option =
      AUTO_REFRESH_OPTIONS.find(
        (o) => String(o.value) === saved
      );

    if (option) {
      setAutoRefreshMs(option.value);
    }
  }, []);

  // =====================================
  // SEARCH
  // =====================================

  const [search, setSearch] =
    useState("");

  // =====================================
  // DATE FILTER
  // =====================================

  const [dateFilter, setDateFilter] =
    useState<DateFilter>("today");

  const [customStartDate, setCustomStartDate] =
    useState(getToday);

  const [customEndDate, setCustomEndDate] =
    useState(getToday);

  // =====================================
  // VIEW / EDIT VEHICLE
  // =====================================

  const [viewVehicle, setViewVehicle] =
    useState<Vehicle | null>(null);

  const [editVehicle, setEditVehicle] =
    useState<Vehicle | null>(null);

  // =====================================
  // USER ROLE
  // =====================================

  const [userRole, setUserRole] =
    useState<string | null>(null);

  // =====================================
  // GET USER ROLE
  // =====================================

  useEffect(() => {
    const role =
      localStorage.getItem("userRole");

    setUserRole(
      role?.trim().toLowerCase() || null
    );
  }, []);

  // =====================================
  // LOAD VEHICLES FROM API
  // =====================================

  const loadVehicles = async (
    filter: DateFilter = dateFilter,
    startDate: string = customStartDate,
    endDate: string = customEndDate,
    // Background refresh: no loading state,
    // keep existing rows on failure
    { silent = false }: { silent?: boolean } = {}
  ) => {
    const requestId = ++requestIdRef.current;

    try {
      inFlightRef.current = true;

      if (!silent) setLoading(true);

      const params = new URLSearchParams();

      // Frontend uses "7days"
      // API uses "last7days"
      const apiFilter =
        filter === "7days"
          ? "last7days"
          : filter;

      params.set(
        "dateFilter",
        apiFilter
      );

      // Custom range (inclusive)
      if (
        apiFilter === "custom" &&
        startDate &&
        endDate
      ) {
        params.set(
          "startDate",
          startDate
        );

        params.set(
          "endDate",
          endDate
        );
      }

      const response = await fetch(
        `/api/vehicles?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch vehicles"
        );
      }

      const data =
        await response.json();

      // API response:
      // {
      //   success: true,
      //   count: number,
      //   vehicles: []
      // }

      if (requestId !== requestIdRef.current) return;

      const nextVehicles: Vehicle[] =
        data.vehicles || [];

      const loadKey = params.toString();

      if (lastLoadKeyRef.current === loadKey) {
        const changes = diffVehicles(
          lastVehiclesRef.current,
          nextVehicles
        );

        if (Object.keys(changes).length) {
          setHighlights((prev) => ({
            ...prev,
            ...changes,
          }));
        }
      } else {
        // Filter changed: nothing is "new"
        setHighlights({});
      }

      lastLoadKeyRef.current = loadKey;
      lastVehiclesRef.current = nextVehicles;

      setVehicles(nextVehicles);

      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Vehicle Fetch Error:",
        error
      );

      if (
        !silent &&
        requestId === requestIdRef.current
      ) {
        setVehicles([]);

        // Don't diff the next load against
        // an emptied list
        lastLoadKeyRef.current = null;
      }
    } finally {
      if (requestId === requestIdRef.current) {
        inFlightRef.current = false;
        setLoading(false);
      }
    }
  };

  const isCustomRangeInvalid =
    dateFilter === "custom" &&
    (!customStartDate ||
      !customEndDate ||
      customStartDate > customEndDate);

  // Paused while editing, so the list
  // doesn't shift under the open modal
  useAutoRefresh(
    () => {
      if (inFlightRef.current) return;

      loadVehicles(
        dateFilter,
        customStartDate,
        customEndDate,
        { silent: true }
      );
    },
    {
      intervalMs: autoRefreshMs,
      enabled:
        !editVehicle &&
        !isCustomRangeInvalid,
    }
  );

  // =====================================
  // INITIAL LOAD
  // =====================================

  // Runs on mount too, so no separate initial load.
  useEffect(() => {
    // Custom range
    if (dateFilter === "custom") {
      if (
        !customStartDate ||
        !customEndDate ||
        customStartDate > customEndDate
      ) {
        return;
      }

      loadVehicles(
        "custom",
        customStartDate,
        customEndDate
      );

      return;
    }

    // Today / Last 7 Days / All
    loadVehicles(
      dateFilter
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  // =====================================
  // ROLE BASED VEHICLE FILTER
  // =====================================

  const roleFilteredVehicles =
    useMemo(() => {
      if (!userRole) {
        return [];
      }

      const role =
        userRole
          .trim()
          .toLowerCase();

      // =================================
      // ADMIN
      // =================================

      if (role === "admin" || role == "view") {
        return vehicles;
      }

      // =================================
      // EMPLOYEE
      // =================================

      if (role === "employee") {
        return vehicles;
      }

      // =================================
      // SHREE CEMENT
      // =================================

      if (
        role === "shreecement"
      ) {
        return vehicles.filter(
          (vehicle) => {
            const buyer =
              String(
                vehicle.buyerDetails ??
                ""
              )
                .trim()
                .toUpperCase();

            return buyer.includes(
              "SHREE CEMENT"
            );
          }
        );
      }

      // =================================
      // WELSPUN
      // =================================

      if (
        role === "welspun"
      ) {
        return vehicles.filter(
          (vehicle) => {
            const buyer =
              String(
                vehicle.buyerDetails ??
                ""
              )
                .trim()
                .toUpperCase();

            return buyer.includes(
              "WELSPUN"
            );
          }
        );
      }

      // =================================
      // EVONITH
      // =================================

      if (
        role === "evonith"
      ) {
        return vehicles.filter(
          (vehicle) => {
            const buyer =
              String(
                vehicle.buyerDetails ??
                ""
              )
                .trim()
                .toUpperCase();

            return buyer.includes(
              "EVONITH"
            );
          }
        );

      }

      return [];
    }, [
      vehicles,
      userRole,
    ]);

  // =====================================
  // LOADING SLIP SENT
  // ADMIN + EMPLOYEE ONLY
  // =====================================

  const loadingSlipSentVehicles =
    useLoadingSlipSentVehicles(
      vehicles
    );

  // =====================================
  // ETP / INVOICE DONE
  // ADMIN + EMPLOYEE ONLY
  // =====================================

  const etpInvoiceDoneVehicles =
    useEtpInvoiceDoneVehicles(
      vehicles
    );

  // =====================================
  // ETP DONE
  // ADMIN + EMPLOYEE ONLY
  // =====================================

  const etpDoneVehicles =
    useEtpDoneVehicles(
      vehicles
    );

  // =====================================
  // ETP GENERATING
  // =====================================

  const etpGeneratingVehicles =
    useEtpGeneratingVehicles(
      vehicles
    );

  // =====================================
  // INVOICE GENERATING
  // =====================================

  const invoiceGeneratingVehicles =
    useInvoiceGeneratingVehicle(
      vehicles
    );

  // =====================================
  // TODAY STATS
  // =====================================

  const {
    todayVehicles,
    dispatchDone,
    waitingForDetails,
    previousPendingVehicles,
  } = useVehicleStats(
    roleFilteredVehicles
  );

  // =====================================
  // TABLE SEARCH
  //
  // DATE FILTER IS NOW HANDLED BY API
  // =====================================

  const filteredData =
    useMemo(() => {
      const searchText =
        search
          .toLowerCase()
          .trim();

      // No search
      if (!searchText) {
        return roleFilteredVehicles;
      }

      return roleFilteredVehicles.filter(
        (vehicle) => {
          const searchableText = [
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
            .toLowerCase();

          return searchableText.includes(
            searchText
          );
        }
      );
    }, [
      roleFilteredVehicles,
      search,
    ]);

  // Only count rows this role can see
  const highlightCounts =
    useMemo(() => {
      let newCount = 0;
      let updatedCount = 0;

      for (const vehicle of roleFilteredVehicles) {
        const type =
          highlights[vehicle._id]?.type;

        if (type === "new") newCount++;
        else if (type === "updated") updatedCount++;
      }

      return { newCount, updatedCount };
    }, [
      roleFilteredVehicles,
      highlights,
    ]);

  // =====================================
  // VIEW VEHICLE
  // ALL ROLES (read only)
  // =====================================

  const handleViewDetails = (
    vehicle: Vehicle
  ) => {
    if (!canViewVehicles) {
      return;
    }

    setViewVehicle(
      vehicle
    );
  };

  // =====================================
  // EDIT VEHICLE
  // ADMIN + EMPLOYEE ONLY
  // =====================================

  const handleEditVehicle = (
    vehicle: Vehicle
  ) => {
    if (!canManageVehicles) {
      return;
    }

    setEditVehicle(
      vehicle
    );
  };

  // =====================================
  // ADMIN + EMPLOYEE ONLY
  // =====================================

  const canManageVehicles =
    userRole === "admin" ||
    userRole === "employee";

  // Customers only see their own vehicles
  // (roleFilteredVehicles), so viewing is safe
  const canViewVehicles =
    !!userRole;

  // =====================================
  // TABLE COLUMNS
  // =====================================

  const columns:
    TableColumn<Vehicle>[] =
    [
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
        key: "inTime",
        label: "In Date & Time",
      },

      {
        key: "outTime",
        label: "Out Date & Time",
      },

      {
        key: "vehicleNo",
        label: "Vehicle No",
        render: (row: Vehicle) => {
          const highlight =
            highlights[row._id];

          return (
            <span className="inline-flex items-center gap-2">
              {row.vehicleNo}

              {highlight && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${highlight.type === "new"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                    }`}
                >
                  <PulseDot
                    tone={
                      highlight.type === "new"
                        ? "green"
                        : "amber"
                    }
                  />

                  {highlight.type === "new"
                    ? "New"
                    : "Updated"}
                </span>
              )}
            </span>
          );
        },
      },

      {
        key: "transporterName",
        label:
          "Transporter Name",
      },

      {
        key: "buyerDetails",
        label: "Buyer Name",
      },

      {
        key: "netWeight",
        label:
          "Weight (MT)",
      },

      {
        key: "status",
        label: "Status",

        render: (row) => {
          const statusStyles:
            Record<
              string,
              string
            > = {
            WAITING_FOR_DETAILS:
              "bg-red-100 text-red-700",

            ENTRY_DONE:
              "bg-blue-100 text-blue-700",

            LOADING_STARTED:
              "bg-orange-100 text-orange-700",

            LOADING_DONE:
              "bg-purple-100 text-purple-700",

            LOADING_SLIP_SENT:
              "bg-indigo-100 text-indigo-700",

            ETP_GENERATING:
              "bg-amber-100 text-amber-700",

            ETP_DONE:
              "bg-yellow-100 text-yellow-700",

            ETP_INVOICE_DONE:
              "bg-cyan-100 text-cyan-700",

            INVOICE_GENERATING:
              "bg-sky-100 text-sky-700",

            DISPATCH_DONE:
              "bg-green-100 text-green-700",

            NOT_REGISTERED:
              "bg-gray-100 text-gray-700",
          };

          return (
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[
                row.status
              ] ||
                "bg-gray-100 text-gray-700"
                }`}
            >
              {String(
                row.status || ""
              ).replaceAll(
                "_",
                " "
              )}
            </span>
          );
        },
      },

      // =====================================
      // ACTIONS
      // VIEW: ALL ROLES
      // EDIT: ADMIN + EMPLOYEE ONLY
      // =====================================

      ...(canViewVehicles
        ? [
          {
            key: "actions",
            label: "Actions",

            render: (
              row: Vehicle
            ) => (
              <div className="flex gap-2">
                {/* VIEW */}

                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    handleViewDetails(
                      row
                    );
                  }}
                  className="cursor-pointer rounded-lg bg-blue-500 px-3 py-1 text-sm text-white transition hover:bg-blue-600"
                >
                  View
                </button>

                {/* EDIT */}

                {canManageVehicles && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      handleEditVehicle(
                        row
                      );
                    }}
                    className="cursor-pointer rounded-lg bg-green-500 px-3 py-1 text-sm text-white transition hover:bg-green-600"
                  >
                    Edit
                  </button>
                )}
              </div>
            ),
          },
        ]
        : []),
    ];

  // =====================================
  // ROLE DISPLAY NAME
  // =====================================

  const displayRole =
    userRole ===
      "shreecement"
      ? "SHREE CEMENT"
      : userRole ===
        "welspun"
        ? "WELSPUN"
        : userRole ===
          "evonith"
          ? "EVONITH"
          : userRole
            ? userRole.toUpperCase()
            : "";

  // =====================================
  // UI
  // =====================================

  return (
    <>
      <div className="space-y-4">

        {/* =================================
            ROLE INFORMATION
        ================================= */}

        {userRole && (
          <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2">
            <div className="text-sm text-gray-600">
              Logged in as:

              <span className="ml-2 font-semibold text-blue-600">
                {displayRole}
              </span>
            </div>

            <div className="text-sm text-gray-500">
              Showing{" "}

              <span className="font-semibold">
                {filteredData.length}
              </span>{" "}

              vehicles
            </div>
          </div>
        )}

        {/* =================================
            STAT CARDS
        ================================= */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

          <StatCard
            title="Today's Vehicles"
            value={
              todayVehicles
            }
          />

          <StatCard
            title="Waiting Previous Day's Vehicles"
            value={
              previousPendingVehicles
            }
          />

          <StatCard
            title="Today's Dispatch"
            value={
              dispatchDone
            }
          />

          <StatCard
            title="Waiting"
            value={
              waitingForDetails
            }
          />

        </div>

        {/* =================================
            STATUS CARDS
            ADMIN + EMPLOYEE ONLY
        ================================= */}

        {canManageVehicles && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">

            {/* LOADING SLIP SENT */}

            {loadingSlipSentVehicles.map(
              (item) => (
                <VehicleStatusCard
                  key={`loading-slip-${item.sno}`}
                  sno={
                    item.sno
                  }
                  tokenNo={
                    item.tokenNo
                  }
                  vehicleNo={
                    item.vehicleNo
                  }
                  vehicle={
                    item
                  }
                  status="LOADING_SLIP_SENT"
                  onClick={() =>
                    setViewVehicle(
                      item
                    )
                  }
                />
              )
            )}

            {/* ETP DONE */}

            {etpDoneVehicles.map(
              (item) => (
                <VehicleStatusCard
                  key={`etp-done-${item.sno}`}
                  sno={
                    item.sno
                  }
                  tokenNo={
                    item.tokenNo
                  }
                  vehicleNo={
                    item.vehicleNo
                  }
                  status={
                    item.status
                  }
                  vehicle={
                    item
                  }
                  onClick={() =>
                    setViewVehicle(
                      item
                    )
                  }
                />
              )
            )}

            {/* ETP + INVOICE DONE */}

            {etpInvoiceDoneVehicles.map(
              (item) => (
                <VehicleStatusCard
                  key={`etp-invoice-${item.sno}`}
                  sno={
                    item.sno
                  }
                  tokenNo={
                    item.tokenNo
                  }
                  vehicleNo={
                    item.vehicleNo
                  }
                  status={
                    item.status
                  }
                  vehicle={
                    item
                  }
                  onClick={() =>
                    setViewVehicle(
                      item
                    )
                  }
                />
              )
            )}

            {/* ETP GENERATING */}

            {etpGeneratingVehicles.map(
              (item: any) => (
                <VehicleStatusCard
                  key={`etp-generating-${item.sno}`}
                  sno={
                    item.sno
                  }
                  tokenNo={
                    item.tokenNo
                  }
                  vehicleNo={
                    item.vehicleNo
                  }
                  status={
                    item.status
                  }
                  vehicle={
                    item
                  }
                  onClick={() =>
                    setViewVehicle(
                      item
                    )
                  }
                />
              )
            )}

            {/* INVOICE GENERATING */}

            {invoiceGeneratingVehicles.map(
              (item) => (
                <VehicleStatusCard
                  key={`invoice-generating-${item.sno}`}
                  sno={
                    item.sno
                  }
                  tokenNo={
                    item.tokenNo
                  }
                  vehicleNo={
                    item.vehicleNo
                  }
                  status={
                    item.status
                  }
                  vehicle={
                    item
                  }
                  onClick={() =>
                    setViewVehicle(
                      item
                    )
                  }
                />
              )
            )}

          </div>
        )}

        {/* =================================
            FILTER SECTION
        ================================= */}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div className="flex flex-wrap items-center gap-2">

            {/* REFRESH */}

            <button
              onClick={() =>
                loadVehicles()
              }
              disabled={loading}
              className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>

            {/* AUTO REFRESH */}

            <div className="relative">

              <select
                aria-label="Auto refresh interval"
                value={
                  autoRefreshMs
                }
                onChange={(e) => {
                  const value =
                    Number(
                      e.target.value
                    );

                  setAutoRefreshMs(
                    value
                  );

                  localStorage.setItem(
                    AUTO_REFRESH_STORAGE_KEY,
                    String(value)
                  );
                }}
                className="h-10 min-w-[140px] cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm font-medium text-gray-700 outline-none transition hover:border-orange-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              >
                {AUTO_REFRESH_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      Auto: {option.label}
                    </option>
                  )
                )}
              </select>

              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                ▼
              </div>

            </div>

            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated{" "}
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}

            {/* DATE FILTER */}

            <div className="relative">

              <select
                value={
                  dateFilter
                }
                onChange={(e) => {
                  const value =
                    e.target
                      .value as DateFilter;

                  setDateFilter(
                    value
                  );
                }}
                className="h-10 min-w-[160px] cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm font-medium text-gray-700 outline-none transition hover:border-orange-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              >
                <option value="today">
                  Today
                </option>

                <option value="7days">
                  Last 7 Days
                </option>

                <option value="custom">
                  Custom Range
                </option>

                <option value="all">
                  All Dates
                </option>
              </select>

              {/* CUSTOM ARROW */}

              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                ▼
              </div>

            </div>

            {/* CUSTOM RANGE */}

            {dateFilter ===
              "custom" && (
                <div
                  role="group"
                  aria-label="Custom date range"
                  className="flex h-10 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 transition hover:border-orange-400 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500"
                >
                  <input
                    type="date"
                    aria-label="Start date"
                    value={
                      customStartDate
                    }
                    max={
                      customEndDate ||
                      getToday()
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      setCustomStartDate(
                        value
                      );

                      // Keep start <= end
                      if (
                        value &&
                        customEndDate &&
                        value >
                        customEndDate
                      ) {
                        setCustomEndDate(
                          value
                        );
                      }
                    }}
                    className="cursor-pointer bg-transparent px-1 text-sm text-gray-700 outline-none"
                  />

                  <span className="text-xs font-medium text-gray-400">
                    to
                  </span>

                  <input
                    type="date"
                    aria-label="End date"
                    value={
                      customEndDate
                    }
                    min={
                      customStartDate ||
                      undefined
                    }
                    max={getToday()}
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      setCustomEndDate(
                        value
                      );

                      if (
                        value &&
                        customStartDate &&
                        value <
                        customStartDate
                      ) {
                        setCustomStartDate(
                          value
                        );
                      }
                    }}
                    className="cursor-pointer bg-transparent px-1 text-sm text-gray-700 outline-none"
                  />
                </div>
              )}

          </div>

          {/* SEARCH */}

          <div className="w-full md:w-80">

            <SearchInput
              value={
                search
              }
              onChange={
                setSearch
              }
              placeholder="Search Vehicle..."
            />

          </div>

        </div>

        {/* =================================
            TABLE
        ================================= */}

        {/* CHANGE BANNER */}

        {(highlightCounts.newCount > 0 ||
          highlightCounts.updatedCount > 0) && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
              <span className="inline-flex items-center gap-2 font-medium">
                <PulseDot />

                {[
                  highlightCounts.newCount > 0 &&
                  `${highlightCounts.newCount} new vehicle${highlightCounts.newCount > 1 ? "s" : ""}`,
                  highlightCounts.updatedCount > 0 &&
                  `${highlightCounts.updatedCount} updated`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>

              <button
                onClick={() =>
                  setHighlights({})
                }
                className="cursor-pointer text-xs font-medium text-green-700 hover:underline"
              >
                Clear
              </button>
            </div>
          )}

        <CommonTable<Vehicle>
          columns={
            columns
          }
          data={
            filteredData
          }
          getRowKey={(row) =>
            row._id
          }
          rowClassName={(row) => {
            const highlight =
              highlights[row._id];

            if (!highlight) return "";

            return highlight.type === "new"
              ? "bg-green-50"
              : "bg-amber-50";
          }}
          loading={
            loading
          }
          onRowClick={() => { }}
        />

      </div>

      {/* =====================================
          VIEW MODAL
          ALL ROLES (read only)
      ===================================== */}

      {canViewVehicles &&
        viewVehicle && (
          <VehicleDetailsModal
            vehicle={
              viewVehicle
            }
            onClose={() =>
              setViewVehicle(
                null
              )
            }
          />
        )}

      {/* =====================================
          EDIT MODAL
          ADMIN + EMPLOYEE ONLY
      ===================================== */}

      {canManageVehicles &&
        editVehicle && (
          <EditVehicleModal
            vehicle={
              editVehicle
            }
            onClose={() =>
              setEditVehicle(
                null
              )
            }
            onSuccess={() => {
              setEditVehicle(
                null
              );

              // Reload using current filter
              loadVehicles();
            }}
          />
        )}

    </>
  );
}