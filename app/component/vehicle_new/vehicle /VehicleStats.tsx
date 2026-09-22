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
}

/* =========================================================
   STAT CARDS
========================================================= */

const STAT_CARDS: StatCard[] = [
    {
        heading: "Today Vehicles",
        key: "todayVehicles",
    },
    {
        heading: "Pending",
        key: "previousPendingVehicles",
    },
    {
        heading: "Dispatched",
        key: "dispatchDone",
    },
    {
        heading: "Waiting",
        key: "waitingForDetails",
    },
];

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
                    ===================================== */

                    setAlertVehicles(
                        result.vehicleAlerts?.vehicles || [],
                    );

                    /* =====================================
                       ALERT COUNTS
                    ===================================== */

                    setAlertCounts(
                        result.vehicleAlerts?.counts ||
                        DEFAULT_ALERT_COUNTS,
                    );
                }
            } catch (error) {
                console.error(
                    "Vehicle stats error:",
                    error,
                );

                if (!cancelled) {
                    setStats(DEFAULT_STATS);

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

        fetchStats();

        return () => {
            cancelled = true;
        };
    }, []);

    /* =====================================================
       CARD CLICK
       
       Vehicle Card
           ↓
       View Modal
    ===================================================== */

    const handleVehicleClick = (
        vehicle: Vehicle,
    ) => {
        const convertedVehicle =
            convertVehicleToVehicleNew(vehicle);

        setSelectedVehicle(convertedVehicle);

        // Make sure edit modal is closed
        setIsEditModalOpen(false);

        // Open view modal
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
         * This allows the Edit button to close ViewModal
         * and immediately open EditModal using the same
         * selected vehicle.
         */
    };

    /* =====================================================
       EDIT VEHICLE
       
       View Modal
           ↓
       Edit Vehicle button
           ↓
       Close View Modal
           ↓
       Open Edit Modal
    ===================================================== */

    const handleEditVehicle = () => {
        if (!selectedVehicle) {
            return;
        }

        // Close View Modal
        setIsViewModalOpen(false);

        // Open Edit Modal
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
       
       Called by EditModal after successful update.
    ===================================================== */

    const handleEditSuccess = () => {
        console.log(
            "Vehicle updated successfully",
        );

        // Close Edit Modal
        setIsEditModalOpen(false);

        // Clear selected vehicle
        setSelectedVehicle(null);

        /*
         * If you want the stats/cards to refresh after
         * successful update, call fetchStats here.
         */
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
                        ({ heading, key }) => (
                            <CommonCard
                                key={key}
                                heading={heading}
                                number={
                                    loading
                                        ? 0
                                        : stats[key]
                                }
                            />
                        ),
                    )}
                </div>

                {/* =================================================
                    VEHICLE ALERTS
                ================================================= */}

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
            </div>

            {/* =====================================================
                VIEW MODAL
            ===================================================== */}

            <ViewModal
                vehicle={selectedVehicle}
                isOpen={isViewModalOpen}
                onClose={handleCloseViewModal}
                onEdit={handleEditVehicle}
            />

            {/* =====================================================
                EDIT MODAL
            ===================================================== */}

            <EditModal
                vehicle={selectedVehicle}
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onSuccess={handleEditSuccess}
            />
        </>
    );
};

export default VehicleStats;