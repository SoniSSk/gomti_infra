/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";

import CommonButton from "../common/CommonButton";
import CommonCard from "../common/CommonCard";
import CommonStateMessage from "../common/CommonStateMessage";
import { getStatusMeta } from "../common/vehicleStatus";
import CommonVehicleStatusCard from "../common/CommonVehicleStatusCard";

import ViewModal from "./ViewModal";
import EditModal from "./EditModal";

import { Vehicle } from "@/app/types/vehicle";
import { Vehicle_new } from "@/app/types/vehicle_new";

/* =========================================================
   VEHICLE STATS
========================================================= */

interface VehicleStats {
    totalVehicles: number;
    todayVehicles: number;
    previousPendingVehicles: number;

    waitingForDetails: number;
    entryDone: number;
    loadingStarted: number;
    loadingDone: number;
    loadingSlipSent: number;
    etpDone: number;
    etpInvoiceDone: number;
    invoiceGenerating: number;
    notRegistered: number;
    dispatchDone: number;
}

/* =========================================================
   ALERT COUNTS
========================================================= */

interface VehicleAlertCounts {
    ON_HOLD: number;
    ETP_GENERATING: number;
    ETP_DONE: number;
    LOADING_SLIP_SENT: number;
    INVOICE_GENERATING: number;
    NOT_REGISTERED: number;
    ETP_INVOICE_DONE: number;
}

/* =========================================================
   API RESPONSE
========================================================= */

interface VehicleStatsResponse {
    success: boolean;

    counts?: Partial<VehicleStats>;

    vehicleAlerts?: {
        total: number;
        counts: Partial<VehicleAlertCounts>;
        vehicles: Vehicle[];
    };

    message?: string;
}

/* =========================================================
   DEFAULT STATS
========================================================= */

const DEFAULT_STATS: VehicleStats = {
    totalVehicles: 0,
    todayVehicles: 0,
    previousPendingVehicles: 0,

    waitingForDetails: 0,
    entryDone: 0,
    loadingStarted: 0,
    loadingDone: 0,
    loadingSlipSent: 0,
    etpDone: 0,
    etpInvoiceDone: 0,
    invoiceGenerating: 0,
    notRegistered: 0,
    dispatchDone: 0,
};

/* =========================================================
   DEFAULT ALERT COUNTS
========================================================= */

const DEFAULT_ALERT_COUNTS: VehicleAlertCounts = {
    ON_HOLD: 0,
    ETP_GENERATING: 0,
    ETP_DONE: 0,
    LOADING_SLIP_SENT: 0,
    INVOICE_GENERATING: 0,
    NOT_REGISTERED: 0,
    ETP_INVOICE_DONE: 0,
};

/* =========================================================
   STAT CARD TYPE
========================================================= */

interface StatCard {
    heading: string;
    key: keyof VehicleStats;

    /** Accent bar colour (matches the status palette). */
    accent: string;

    /**
     * Value adjustment for display only.
     *
     * Example:
     * offset: -4
     *
     * API = 20
     * Card = 16
     */
    offset?: number;
}

/* =========================================================
   STAT CARDS
========================================================= */

const ALERT_CHIPS: {
    key: keyof VehicleAlertCounts;
    label: string;
}[] = [
    { key: "ON_HOLD", label: "On Hold" },
    { key: "ETP_GENERATING", label: "ETP Generating" },
    { key: "ETP_DONE", label: "ETP Done" },
    { key: "LOADING_SLIP_SENT", label: "Loading Slip Sent" },
    { key: "INVOICE_GENERATING", label: "Invoice Generating" },
    { key: "ETP_INVOICE_DONE", label: "ETP Invoice Done" },
    { key: "NOT_REGISTERED", label: "Not Registered" },
];

const STAT_CARDS: StatCard[] = [
    {
        heading: "Today's Vehicles",
key: "todayVehicles",
        accent: "bg-orange-500",
    },

    {
        heading: "Previous Day Vehicles",
key: "previousPendingVehicles",
        accent: "bg-amber-500",
        // offset: -4,
    },

    {
        heading: "Dispatched",
key: "dispatchDone",
        accent: "bg-green-500",
        offset: 0,
    },

    {
        heading: "Waiting For Details",
key: "waitingForDetails",
        accent: "bg-red-500",
    },
];

/* =========================================================
   READ ONLY ROLES
========================================================= */

const NO_ALERT_ROLES = [
    "welspun",
    "evonith",
    "shreecement",
];

/* =========================================================
   GET USER ROLE
========================================================= */

const normalizeRole = (role?: string | null): string =>
    role?.trim().toLowerCase().replace(/\s+/g, "") ?? "";

const getUserRole = (): string => {
    if (typeof window === "undefined") {
        return "";
    }

    return normalizeRole(localStorage.getItem("userRole"));
};

/* =========================================================
   CHECK ALERT ACCESS
========================================================= */

const canShowVehicleAlerts = (): boolean => {
    const role = getUserRole();

    return !NO_ALERT_ROLES.includes(role);
};

/* =========================================================
   CONVERT VEHICLE
========================================================= */

const convertVehicleToVehicleNew = (
    vehicle: Vehicle,
): Vehicle_new => {
    return {
        ...vehicle,

        netWeight:
            vehicle.netWeight !== undefined &&
                vehicle.netWeight !== null &&
                vehicle.netWeight !== ""
                ? Number(vehicle.netWeight)
                : undefined,
    } as Vehicle_new;
};

/* =========================================================
   COMPONENT
========================================================= */

interface VehicleStatsProps {
    /** Change this value to force a refetch (e.g. after adding a vehicle). */
    refreshKey?: number;
    /** Change this value for a background refetch (auto refresh): no skeleton, keeps stats on failure. */
    pollKey?: number;
    /** Role from the session; falls back to localStorage when omitted. */
    userRole?: string;
    /** Called after a vehicle is saved from the alert edit modal. */
    onVehicleUpdated?: () => void;
}

const VehicleStats = ({
    refreshKey = 0,
    pollKey = 0,
    userRole: sessionRole,
    onVehicleUpdated,
}: VehicleStatsProps) => {
    /* =====================================================
       STATS
    ===================================================== */

    const [stats, setStats] =
        useState<VehicleStats>(DEFAULT_STATS);

    /* =====================================================
       ALERT VEHICLES
    ===================================================== */

    const [alertVehicles, setAlertVehicles] =
        useState<Vehicle[]>([]);

    /* =====================================================
       ALERT COUNTS
    ===================================================== */

    const [alertCounts, setAlertCounts] =
        useState<VehicleAlertCounts>(
            DEFAULT_ALERT_COUNTS,
        );

    /* =====================================================
       LOADING
    ===================================================== */

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    // Stats + alerts from the last successful load
    const hasStatsRef = useRef(false);

    // Last pollKey seen, to tell a poll from other refetches
    const lastPollKeyRef = useRef(pollKey);

const [retryKey, setRetryKey] =
        useState(0);

    /* =====================================================
       ALERT PANEL UI STATE
    ===================================================== */

    const [alertFilter, setAlertFilter] =
        useState<keyof VehicleAlertCounts | null>(null);

    const [alertsCollapsed, setAlertsCollapsed] =
        useState(false);

    /* =====================================================
       ROLE READY
    ===================================================== */

    const [userRole, setUserRole] =
        useState(() => normalizeRole(sessionRole));

    const [roleReady, setRoleReady] =
        useState(() => Boolean(normalizeRole(sessionRole)));

    /* =====================================================
       SELECTED VEHICLE
    ===================================================== */

    const [selectedVehicle, setSelectedVehicle] =
        useState<Vehicle_new | null>(null);

    /* =====================================================
       VIEW MODAL
    ===================================================== */

    const [isViewModalOpen, setIsViewModalOpen] =
        useState(false);

    /* =====================================================
       EDIT MODAL
    ===================================================== */

    const [isEditModalOpen, setIsEditModalOpen] =
        useState(false);

    /* =====================================================
       CHECK USER ROLE
    ===================================================== */

    useEffect(() => {
        const role =
            normalizeRole(sessionRole) ||
            getUserRole();

        console.log(
            "VehicleStats User Role:",
            role,
        );

        setUserRole(role);

        /*
         * Fetch even when no role is known, so the cards never
         * wait forever; alerts stay hidden in that case.
         */
        setRoleReady(true);
    }, [sessionRole]);

    /* =====================================================
       CHECK ALERT PERMISSION
    ===================================================== */

    const showVehicleAlerts =
        userRole !== "" &&
        !NO_ALERT_ROLES.includes(userRole);

    /* =====================================================
       FETCH STATS
    ===================================================== */

    useEffect(() => {
        let cancelled = false;

        const isPoll =
            pollKey !== lastPollKeyRef.current &&
            hasStatsRef.current;

        lastPollKeyRef.current = pollKey;

        const fetchStats = async () => {
            try {
                if (!isPoll) {
                    setLoading(true);
                    setError(null);
                }

                const response = await fetch(
                    "/api/vehicles/stats",
                    {
                        method: "GET",
                        cache: "no-store",
                    },
                );

                const result: VehicleStatsResponse =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message ||
                        "Failed to fetch vehicle stats",
                    );
                }

                if (
                    !cancelled &&
                    result.success
                ) {
                    /* =====================================
                       MAIN STATS
                    ===================================== */

                    setStats({
                        ...DEFAULT_STATS,
                        ...(result.counts || {}),
                    });

                    /* =====================================
                       ALERT VEHICLES

                       Only store alerts for allowed
                       roles.
                    ===================================== */

                    if (showVehicleAlerts) {
                        setAlertVehicles(
                            result.vehicleAlerts
                                ?.vehicles || [],
                        );

                        setAlertCounts({
                            ...DEFAULT_ALERT_COUNTS,
                            ...(result.vehicleAlerts?.counts || {}),
                        });
                    } else {
                        setAlertVehicles([]);

                        setAlertCounts(
                            DEFAULT_ALERT_COUNTS,
                        );
                    }

                    hasStatsRef.current = true;

                    setError(null);
                }
            } catch (error) {
                console.error(
                    "Vehicle stats error:",
                    error,
                );

                // Background poll failed: keep current stats
                if (!cancelled && !isPoll) {
                    setError(
                        "Couldn't load vehicle stats.",
                    );

                    setStats(
                        DEFAULT_STATS,
                    );

                    setAlertVehicles([]);

                    setAlertCounts(
                        DEFAULT_ALERT_COUNTS,
                    );
                }
            } finally {
                if (!cancelled && !isPoll) {
                    setLoading(false);
                }
            }
        };

        /*
         * Wait until localStorage role has been
         * loaded before fetching stats.
         */

        if (roleReady) {
            fetchStats();
        }

        return () => {
            cancelled = true;
        };
    }, [roleReady, showVehicleAlerts, refreshKey, pollKey, retryKey]);

    /* =====================================================
       GET CARD DISPLAY VALUE
       
       Applies offset ONLY to the cards that define it.
       
       Previous:
       API 20 -> 16

       Dispatched:
       API 20 -> 16

       Other cards:
       API value remains unchanged.
    ===================================================== */

    const getCardValue = (
        key: keyof VehicleStats,
        offset?: number,
    ): number => {
        const originalValue =
            Number(stats[key] ?? 0);

        const safeValue = Number.isFinite(
            originalValue,
        )
            ? originalValue
            : 0;

        if (
            offset === undefined ||
            offset === 0
        ) {
            return Math.max(
                0,
                safeValue,
            );
        }

        return Math.max(
            0,
            safeValue + offset,
        );
    };

    /* =====================================================
       CARD CLICK
       
       Only available for roles which can see alerts.
    ===================================================== */

    const handleVehicleClick = (
        vehicle: Vehicle,
    ) => {
        if (!showVehicleAlerts) {
            return;
        }

        const convertedVehicle =
            convertVehicleToVehicleNew(
                vehicle,
            );

        setSelectedVehicle(
            convertedVehicle,
        );

        setIsEditModalOpen(false);

        setIsViewModalOpen(true);
    };

    /* =====================================================
       CLOSE VIEW MODAL
    ===================================================== */

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);

        /*
         * Do NOT clear selectedVehicle here.
         *
         * This allows EditModal to open using
         * the same selected vehicle.
         */
    };

    /* =====================================================
       EDIT VEHICLE
    ===================================================== */

    const handleEditVehicle = () => {
        if (!selectedVehicle) {
            return;
        }

        /*
         * Extra protection:
         * readonly users can never open EditModal.
         */

        if (!showVehicleAlerts) {
            return;
        }

        setIsViewModalOpen(false);

        setIsEditModalOpen(true);
    };

    /* =====================================================
       CLOSE EDIT MODAL
    ===================================================== */

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);

        setSelectedVehicle(null);
    };

    /* =====================================================
       EDIT SUCCESS
    ===================================================== */

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);

        setSelectedVehicle(null);

        onVehicleUpdated?.();
    };

    const filteredAlertVehicles = alertFilter
        ? alertVehicles.filter(
            (vehicle) =>
                String(vehicle.status ?? "").toUpperCase() ===
                alertFilter,
        )
        : alertVehicles;

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <>
            <div className="w-full space-y-6">

                {/* =================================================
                    MAIN STAT CARDS
                ================================================= */}

                <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {STAT_CARDS.map(
                        ({
                            heading,
                            key,
                            offset,
                            accent,
                        }) => (
                            <CommonCard
                                key={key}
                                heading={heading}
                                accent={accent}
                                loading={loading}
                                number={
                                    error
                                        ? "—"
                                        : getCardValue(
                                            key,
                                            offset,
                                        )
                                }
                            />
                        ),
                    )}
                </div>

                {error && !loading && (
                    <div
                        role="alert"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                    >
                        <p className="text-sm font-medium text-red-700">
                            {error}
                        </p>

                        <CommonButton
                            variant="danger"
                            size="sm"
                            icon={RefreshCw}
                            onClick={() =>
                                setRetryKey((key) => key + 1)
                            }
                        >
                            Retry
                        </CommonButton>
                    </div>
                )}

                {/* =================================================
                    VEHICLE ALERTS

                    IMPORTANT:
                    welspun
                    evonith
                    shreecement

                    will NOT see this section.
                ================================================= */}

                {showVehicleAlerts && (
                    <section
                        aria-labelledby="vehicle-alerts-heading"
                        className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                    >
                        {/* ================= PANEL HEADER ================= */}

                        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <h2
                                    id="vehicle-alerts-heading"
                                    className="text-base font-semibold text-gray-900"
                                >
                                    Vehicle Alerts
                                </h2>

                                {!loading && (
                                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-orange-700 ring-1 ring-inset ring-orange-600/15">
                                        {alertVehicles.length}
                                    </span>
                                )}

                                <p className="hidden truncate text-sm text-gray-500 sm:block">
                                    Vehicles requiring attention
                                </p>
                            </div>

                            <CommonButton
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    setAlertsCollapsed(
                                        (collapsed) => !collapsed,
                                    )
                                }
                                aria-expanded={!alertsCollapsed}
                                aria-controls="vehicle-alerts-body"
                            >
                                {alertsCollapsed ? "Show" : "Hide"}

                                <ChevronDown
                                    className={`h-4 w-4 transition-transform duration-200 ${alertsCollapsed ? "" : "rotate-180"}`}
                                    aria-hidden="true"
                                />
                            </CommonButton>
                        </div>

                        {!alertsCollapsed && (
                            <div
                                id="vehicle-alerts-body"
                                className="space-y-4 border-t border-gray-100 px-4 py-4 sm:px-5"
                            >
                                {/* ================= FILTER CHIPS ================= */}

                                <div
                                    className="flex flex-wrap gap-2"
                                    role="group"
                                    aria-label="Filter alerts by status"
                                >
                                    {ALERT_CHIPS.map(({ key, label }) => {
                                        const active = alertFilter === key;
                                        const meta = getStatusMeta(key);

                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() =>
                                                    setAlertFilter(
                                                        active ? null : key,
                                                    )
                                                }
                                                className={`inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-orange-200 ${active
                                                    ? "border-gray-900 bg-gray-900 text-white"
                                                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <span
                                                    className={`h-2 w-2 rounded-full ${meta.dot}`}
                                                    aria-hidden="true"
                                                />
                                                {label}
                                                <span
                                                    className={`tabular-nums ${active ? "text-white/80" : "text-gray-400"}`}
                                                >
                                                    {loading ? "–" : alertCounts[key]}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* ================= CARDS ================= */}

                                {loading ? (
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        {Array.from({ length: 3 }, (_, index) => (
                                            <div
                                                key={index}
                                                className="h-[104px] animate-pulse rounded-lg border border-gray-100 bg-gray-50"
                                            />
                                        ))}
                                    </div>
                                ) : filteredAlertVehicles.length === 0 ? (
                                    <CommonStateMessage
                                        className="rounded-lg border border-dashed border-gray-200 px-4 py-8"
                                        title={
                                            alertFilter
                                                ? "No vehicles with this status"
                                                : "All clear — no vehicles need attention"
                                        }
                                        action={
                                            alertFilter && (
                                                <CommonButton
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setAlertFilter(null)}
                                                >
                                                    Show all alerts
                                                </CommonButton>
                                            )
                                        }
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        {filteredAlertVehicles.map(
                                            (
                                                vehicle,
                                                index,
                                            ) => (
                                                <CommonVehicleStatusCard
                                                    key={
                                                        vehicle._id ||
                                                        `${vehicle.vehicleNo}-${index}`
                                                    }
                                                    tokenNo={
                                                        vehicle.tokenNo
                                                    }
                                                    vehicleNo={
                                                        vehicle.vehicleNo
                                                    }
                                                    status={
                                                        vehicle.status
                                                    }
                                                    vehicle={
                                                        vehicle
                                                    }
                                                    onClick={() =>
                                                        handleVehicleClick(
                                                            vehicle,
                                                        )
                                                    }
                                                    showEdit={false}
                                                    showGoogleChat={
                                                        false
                                                    }
                                                />
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}
            </div>

            {/* =====================================================
                VIEW MODAL

                Extra protection:
                readonly roles cannot open it.
            ===================================================== */}

            {showVehicleAlerts && (
                <ViewModal
                    vehicle={selectedVehicle}
                    isOpen={isViewModalOpen}
                    onClose={
                        handleCloseViewModal
                    }
                    onEdit={
                        handleEditVehicle
                    }
                />
            )}

            {/* =====================================================
                EDIT MODAL

                Extra protection:
                readonly roles cannot open it.
            ===================================================== */}

            {showVehicleAlerts && (
                <EditModal
                    vehicle={selectedVehicle}
                    isOpen={isEditModalOpen}
                    onClose={
                        handleCloseEditModal
                    }
                    onSuccess={
                        handleEditSuccess
                    }
                />
            )}
        </>
    );
};

export default VehicleStats;