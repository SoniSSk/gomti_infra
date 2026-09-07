/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  useEffect,
  useMemo,
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

type DateFilter =
  | "all"
  | "today"
  | "7days"
  | "custom";

export default function VehicleTable() {
  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [dateFilter, setDateFilter] =
    useState<DateFilter>("7days");

  const [customDate, setCustomDate] =
    useState("");

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
  // GET USER ROLE FROM LOCAL STORAGE
  // =====================================

  useEffect(() => {
    const role =
      localStorage.getItem("userRole");

    setUserRole(
      role?.trim().toLowerCase() || null,
    );
  }, []);

  // =====================================
  // PARSE VEHICLE DATE
  // =====================================

  const parseVehicleDate = (
    dateTime: unknown,
  ): Date | null => {
    if (!dateTime) {
      return null;
    }

    const value =
      String(dateTime).trim();

    // DD-MM-YYYY HH:mm AM/PM
    const customFormat =
      /^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

    const match =
      value.match(customFormat);

    if (match) {
      const [
        ,
        day,
        month,
        year,
        hour,
        minute,
        ampm,
      ] = match;

      let hours =
        Number(hour);

      if (
        ampm.toUpperCase() === "PM" &&
        hours !== 12
      ) {
        hours += 12;
      }

      if (
        ampm.toUpperCase() === "AM" &&
        hours === 12
      ) {
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

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return null;
    }

    return date;
  };

  // =====================================
  // CHECK SAME DAY
  // =====================================

  const isSameDay = (
    date1: Date,
    date2: Date,
  ) => {
    return (
      date1.getFullYear() ===
      date2.getFullYear() &&
      date1.getMonth() ===
      date2.getMonth() &&
      date1.getDate() ===
      date2.getDate()
    );
  };

  // =====================================
  // LOAD VEHICLES
  // =====================================

  const loadVehicles = async () => {
    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/vehicles",
          {
            cache: "no-store",
          },
        );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch vehicles",
        );
      }

      const data: Vehicle[] =
        await response.json();

      setVehicles(data);
    } catch (error) {
      console.error(
        "Vehicle Fetch Error:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // INITIAL LOAD
  // =====================================

  useEffect(() => {
    loadVehicles();
  }, []);

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

      if (role === "admin") {
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
                "",
              )
                .trim()
                .toUpperCase();

            return buyer.includes(
              "SHREE CEMENT",
            );
          },
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
                "",
              )
                .trim()
                .toUpperCase();

            return buyer.includes(
              "WELSPUN",
            );
          },
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
                "",
              )
                .trim()
                .toUpperCase();

            return buyer.includes(
              "EVONITH",
            );
          },
        );
      }

      return [];
    }, [
      vehicles,
      userRole,
    ]);

  // =====================================
  // LAST 7 DAYS
  // =====================================

  const last7DaysVehicles =
    useMemo(() => {
      const now =
        new Date();

      const todayStart =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );

      const sevenDaysAgo =
        new Date(
          todayStart,
        );

      sevenDaysAgo.setDate(
        todayStart.getDate() - 6,
      );

      const tomorrowStart =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
        );

      return roleFilteredVehicles.filter(
        (vehicle) => {
          const vehicleDate =
            parseVehicleDate(
              vehicle.dateTime,
            );

          if (!vehicleDate) {
            return false;
          }

          return (
            vehicleDate >=
            sevenDaysAgo &&
            vehicleDate <
            tomorrowStart
          );
        },
      );
    }, [
      roleFilteredVehicles,
    ]);

  // =====================================
  // LOADING SLIP SENT
  // ADMIN + EMPLOYEE ONLY
  // =====================================

  const loadingSlipSentVehicles =
    useLoadingSlipSentVehicles(
      last7DaysVehicles,
    );

  // =====================================
  // ETP / INVOICE DONE
  // ADMIN + EMPLOYEE ONLY
  // =====================================

  const etpInvoiceDoneVehicles =
    useEtpInvoiceDoneVehicles(
      last7DaysVehicles,
    );

  // =====================================
  // TODAY STATS
  // =====================================

  const {
    todayVehicles,
    todayDispatchDone,
    todayWaitingForDetails,
  } = useVehicleStats(
    roleFilteredVehicles,
  );

  // =====================================
  // TABLE FILTER
  // =====================================

  const filteredData =
    useMemo(() => {
      const searchText =
        search
          .toLowerCase()
          .trim();

      const now =
        new Date();

      const todayStart =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );

      const sevenDaysAgo =
        new Date(
          todayStart,
        );

      sevenDaysAgo.setDate(
        todayStart.getDate() - 6,
      );

      const tomorrowStart =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
        );

      return roleFilteredVehicles.filter(
        (vehicle) => {
          const vehicleDate =
            parseVehicleDate(
              vehicle.dateTime,
            );

          let matchesDate =
            true;

          // =================================
          // TODAY
          // =================================

          if (
            dateFilter ===
            "today"
          ) {
            matchesDate =
              vehicleDate
                ? isSameDay(
                  vehicleDate,
                  now,
                )
                : false;
          }

          // =================================
          // LAST 7 DAYS
          // =================================

          if (
            dateFilter ===
            "7days"
          ) {
            matchesDate =
              vehicleDate
                ? vehicleDate >=
                sevenDaysAgo &&
                vehicleDate <
                tomorrowStart
                : false;
          }

          // =================================
          // CUSTOM DATE
          // =================================

          if (
            dateFilter ===
            "custom"
          ) {
            if (!customDate) {
              matchesDate = true;
            } else {
              const selectedDate =
                new Date(
                  `${customDate}T00:00:00`,
                );

              matchesDate =
                vehicleDate
                  ? isSameDay(
                    vehicleDate,
                    selectedDate,
                  )
                  : false;
            }
          }

          // =================================
          // ALL
          // =================================

          if (
            dateFilter ===
            "all"
          ) {
            matchesDate = true;
          }

          // =================================
          // SEARCH
          // =================================

          const searchableText =
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
              .toLowerCase();

          const matchesSearch =
            searchableText.includes(
              searchText,
            );

          return (
            matchesDate &&
            matchesSearch
          );
        },
      );
    }, [
      roleFilteredVehicles,
      search,
      dateFilter,
      customDate,
    ]);

  // =====================================
  // VIEW VEHICLE
  // ADMIN + EMPLOYEE ONLY
  // =====================================

  const handleViewDetails = (
    vehicle: Vehicle,
  ) => {
    if (!canManageVehicles) {
      return;
    }

    setViewVehicle(
      vehicle,
    );
  };

  // =====================================
  // EDIT VEHICLE
  // ADMIN + EMPLOYEE ONLY
  // =====================================

  const handleEditVehicle = (
    vehicle: Vehicle,
  ) => {
    if (!canManageVehicles) {
      return;
    }

    setEditVehicle(
      vehicle,
    );
  };

  // =====================================
  // ADMIN + EMPLOYEE ONLY
  // =====================================

  const canManageVehicles =
    userRole === "admin" ||
    userRole === "employee";

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
        key: "vehicleNo",
        label: "Vehicle No",
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
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[
                row.status
                ] ||
                "bg-gray-100 text-gray-700"
                }`}
            >
              {String(
                row.status || "",
              ).replaceAll(
                "_",
                " ",
              )}
            </span>
          );
        },
      },

      // =====================================
      // ACTIONS
      // ADMIN + EMPLOYEE ONLY
      // =====================================

      ...(canManageVehicles
        ? [
          {
            key: "actions",
            label: "Actions",

            render: (
              row: Vehicle,
            ) => (
              <div className="flex gap-2">

                {/* VIEW */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    handleViewDetails(
                      row,
                    );
                  }}
                  className="cursor-pointer rounded-lg bg-blue-500 px-3 py-1 text-sm text-white transition hover:bg-blue-600"
                >
                  View
                </button>

                {/* EDIT */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    handleEditVehicle(
                      row,
                    );
                  }}
                  className="cursor-pointer rounded-lg bg-green-500 px-3 py-1 text-sm text-white transition hover:bg-green-600"
                >
                  Edit
                </button>

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <StatCard
            title="Today's Vehicles"
            value={
              todayVehicles
            }
          />

          <StatCard
            title="Today's Dispatch"
            value={
              todayDispatchDone
            }
          />

          <StatCard
            title="Waiting"
            value={
              todayWaitingForDetails
            }
          />

        </div>

        {/* =================================
            STATUS CARDS
            ADMIN + EMPLOYEE ONLY
        ================================= */}

        {canManageVehicles && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">

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
                  status="LOADING_SLIP_SENT"
                  onClick={() =>
                    setViewVehicle(
                      item,
                    )
                  }
                />
              ),
            )}

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
                  onClick={() =>
                    setViewVehicle(
                      item,
                    )
                  }
                />
              ),
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
              onClick={
                loadVehicles
              }
              className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-white transition hover:bg-orange-600"
            >
              Refresh
            </button>

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
                    value,
                  );

                  if (
                    value !==
                    "custom"
                  ) {
                    setCustomDate(
                      "",
                    );
                  }
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
                  Custom Date
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

            {/* CUSTOM DATE */}

            {dateFilter ===
              "custom" && (
                <input
                  type="date"
                  value={
                    customDate
                  }
                  onChange={(e) =>
                    setCustomDate(
                      e.target.value,
                    )
                  }
                  className="h-10 cursor-pointer rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition hover:border-orange-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
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

        <CommonTable<Vehicle>
          columns={
            columns
          }
          data={
            filteredData
          }
          loading={
            loading
          }
          onRowClick={() => { }}
        />

      </div>

      {/* =================================
          VIEW MODAL
          ADMIN + EMPLOYEE ONLY
      ================================= */}

      {canManageVehicles &&
        viewVehicle && (
          <VehicleDetailsModal
            vehicle={
              viewVehicle
            }
            onClose={() =>
              setViewVehicle(
                null,
              )
            }
          />
        )}

      {/* =================================
          EDIT MODAL
          ADMIN + EMPLOYEE ONLY
      ================================= */}

      {canManageVehicles &&
        editVehicle && (
          <EditVehicleModal
            vehicle={
              editVehicle
            }
            onClose={() =>
              setEditVehicle(
                null,
              )
            }
            onSuccess={() => {
              setEditVehicle(
                null,
              );

              loadVehicles();
            }}
          />
        )}

    </>
  );
}