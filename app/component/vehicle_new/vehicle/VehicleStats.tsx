/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import React, { useEffect, useState } from "react";

import CommonCard from "../common/CommonCard";
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
    ETP_DONE: number;
    LOADING_SLIP_SENT: number;
    INVOICE_GENERATING: number;
    NOT_REGISTERD: number;
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
        counts: VehicleAlertCounts;
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
    ETP_DONE: 0,
    LOADING_SLIP_SENT: 0,
    INVOICE_GENERATING: 0,
    NOT_REGISTERD: 0,
    ETP_INVOICE_DONE: 0,
};

/* =========================================================
   STAT CARD TYPE
========================================================= */

interface StatCard {
    heading: string;
    key: keyof VehicleStats;

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

const STAT_CARDS: StatCard[] = [
    {
        heading: "Today's Vehicles",
        key: "todayVehicles",
    },

    {
        heading: "Previous Day Vehicles",
        key: "previousPendingVehicles",
        offset: -4,
    },

    {
        heading: "Dispatched",
        key: "dispatchDone",
        offset: 0,
    },

    {
        heading: "Waiting For Details",
        key: "waitingForDetails",
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

const getUserRole = (): string => {
    if (typeof window === "undefined") {
        return "";
    }

    return (
        localStorage
            .getItem("userRole")
            ?.trim()
            .toLowerCase()
            .replace(/\s+/g, "") ?? ""
    );
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

const VehicleStats = () => {
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

    /* =====================================================
       ROLE READY
    ===================================================== */

    const [userRole, setUserRole] =
        useState("");

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
        const role = getUserRole();

        console.log(
            "VehicleStats User Role:",
            role,
        );

        setUserRole(role);
    }, []);

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

        const fetchStats = async () => {
            try {
                setLoading(true);

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

                        setAlertCounts(
                            result.vehicleAlerts
                                ?.counts ||
                            DEFAULT_ALERT_COUNTS,
                        );
                    } else {
                        setAlertVehicles([]);

                        setAlertCounts(
                            DEFAULT_ALERT_COUNTS,
                        );
                    }
                }
            } catch (error) {
                console.error(
                    "Vehicle stats error:",
                    error,
                );

                if (!cancelled) {
                    setStats(
                        DEFAULT_STATS,
                    );

                    setAlertVehicles([]);

                    setAlertCounts(
                        DEFAULT_ALERT_COUNTS,
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        /*
         * Wait until localStorage role has been
         * loaded before fetching stats.
         */

        if (userRole !== "") {
            fetchStats();
        }

        return () => {
            cancelled = true;
        };
    }, [userRole, showVehicleAlerts]);

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
        console.log(
            "Vehicle updated successfully",
        );

        setIsEditModalOpen(false);

        setSelectedVehicle(null);
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <>
            <div className="w-full space-y-5">

                {/* =================================================
                    MAIN STAT CARDS
                ================================================= */}

                <div
                    className="
                        grid
                        w-full
                        grid-cols-1
                        gap-3
                        sm:grid-cols-2
                        lg:grid-cols-4
                        xl:gap-4
                    "
                >
                    {STAT_CARDS.map(
                        ({
                            heading,
                            key,
                            offset,
                        }) => (
                            <CommonCard
                                key={key}
                                heading={heading}
                                number={
                                    loading
                                        ? 0
                                        : getCardValue(
                                            key,
                                            offset,
                                        )
                                }
                            />
                        ),
                    )}
                </div>

                {/* =================================================
                    VEHICLE ALERTS

                    IMPORTANT:
                    welspun
                    evonith
                    shreecement

                    will NOT see this section.
                ================================================= */}

                {showVehicleAlerts && (
                    <div className="w-full">

                        {/* =============================================
                            ALERT HEADER
                        ============================================= */}

                        <div
                            className="
                                mb-4
                                flex
                                flex-wrap
                                items-center
                                justify-between
                                gap-3
                            "
                        >
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Vehicle Alerts
                                </h2>

                                <p className="text-xs text-gray-500">
                                    Vehicles requiring attention
                                </p>
                            </div>

                            <div
                                className="
                                    rounded-full
                                    bg-orange-50
                                    px-3
                                    py-1.5
                                    text-xs
                                    font-bold
                                    text-orange-600
                                "
                            >
                                Total:{" "}
                                {loading
                                    ? 0
                                    : alertVehicles.length}
                            </div>
                        </div>

                        {/* =============================================
                            ALERT COUNTS
                        ============================================= */}

                        <div
                            className="
                                mb-4
                                flex
                                flex-wrap
                                gap-2
                            "
                        >
                            <div
                                className="
                                    rounded-lg
                                    bg-yellow-50
                                    px-3
                                    py-2
                                    text-xs
                                    font-semibold
                                    text-yellow-700
                                "
                            >
                                ETP Done:{" "}
                                {alertCounts.ETP_DONE}
                            </div>

                            <div
                                className="
                                    rounded-lg
                                    bg-indigo-50
                                    px-3
                                    py-2
                                    text-xs
                                    font-semibold
                                    text-indigo-700
                                "
                            >
                                Loading Slip:{" "}
                                {
                                    alertCounts.LOADING_SLIP_SENT
                                }
                            </div>

                            <div
                                className="
                                    rounded-lg
                                    bg-sky-50
                                    px-3
                                    py-2
                                    text-xs
                                    font-semibold
                                    text-sky-700
                                "
                            >
                                Invoice Generating:{" "}
                                {
                                    alertCounts.INVOICE_GENERATING
                                }
                            </div>

                            <div
                                className="
                                    rounded-lg
                                    bg-gray-100
                                    px-3
                                    py-2
                                    text-xs
                                    font-semibold
                                    text-gray-700
                                "
                            >
                                Not Registered:{" "}
                                {
                                    alertCounts.NOT_REGISTERD
                                }
                            </div>

                            <div
                                className="
                                    rounded-lg
                                    bg-cyan-50
                                    px-3
                                    py-2
                                    text-xs
                                    font-semibold
                                    text-cyan-700
                                "
                            >
                                ETP Invoice Done:{" "}
                                {
                                    alertCounts.ETP_INVOICE_DONE
                                }
                            </div>
                        </div>

                        {/* =============================================
                            VEHICLE CARDS
                        ============================================= */}

                        {loading ? (
                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-gray-100
                                    bg-gray-50
                                    px-4
                                    py-10
                                    text-center
                                "
                            >
                                <p className="text-sm text-gray-500">
                                    Loading vehicle alerts...
                                </p>
                            </div>
                        ) : alertVehicles.length === 0 ? (
                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-dashed
                                    border-gray-200
                                    bg-gray-50
                                    px-4
                                    py-10
                                    text-center
                                "
                            >
                                <p className="text-sm font-medium text-gray-500">
                                    No vehicle alerts
                                </p>
                            </div>
                        ) : (
                            <div
                                className="
                                    grid
                                    grid-cols-1
                                    gap-3
                                    md:grid-cols-2
                                    xl:grid-cols-3
                                "
                            >
                                {alertVehicles.map(
                                    (
                                        vehicle,
                                        index,
                                    ) => (
                                        <CommonVehicleStatusCard
                                            key={
                                                vehicle._id ||
                                                `${vehicle.vehicleNo}-${index}`
                                            }
                                            sno={
                                                vehicle.sno ??
                                                index + 1
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