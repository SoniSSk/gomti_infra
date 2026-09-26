/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useCallback, useEffect, useState } from "react";

import CommonCard from "../common/CommonCard";
import CommonVehicleStatusCard from "../common/CommonVehicleStatusCard";
import { getStatusMeta } from "../common/vehicleStatus";

import ViewModal from "./ViewModal";
import EditModal from "./EditModal";

import { Vehicle } from "@/app/types/vehicle";
import { Vehicle_new } from "@/app/types/vehicle_new";

/* =========================================================
   TYPES
========================================================= */

interface VehicleStatCounts {
    totalVehicles: number;
    todayVehicles: number;
    previousPendingVehicles: number;

    waitingForDetails: number;
    entryDone: number;
    loadingStarted: number;
    loadingDone: number;
    loadingSlipSent: number;
    onHold: number;
    etpDone: number;
    etpInvoiceDone: number;
    invoiceGenerating: number;
    notRegistered: number;
    dispatchDone: number;
}

type AlertStatus =
    | "ON_HOLD"
    | "ETP_DONE"
    | "LOADING_SLIP_SENT"
    | "INVOICE_GENERATING"
    | "NOT_REGISTERED"
    | "ETP_INVOICE_DONE";

type VehicleAlertCounts = Record<AlertStatus, number>;

interface VehicleStatsResponse {
    success: boolean;
    counts?: Partial<VehicleStatCounts>;
    vehicleAlerts?: {
        total: number;
        counts: Partial<VehicleAlertCounts>;
        vehicles: Vehicle[];
    };
    message?: string;
}

/* =========================================================
   CONFIG
========================================================= */

const DEFAULT_STATS: VehicleStatCounts = {
    totalVehicles: 0,
    todayVehicles: 0,
    previousPendingVehicles: 0,

    waitingForDetails: 0,
    entryDone: 0,
    loadingStarted: 0,
    loadingDone: 0,
    loadingSlipSent: 0,
    onHold: 0,
    etpDone: 0,
    etpInvoiceDone: 0,
    invoiceGenerating: 0,
    notRegistered: 0,
    dispatchDone: 0,
};

const DEFAULT_ALERT_COUNTS: VehicleAlertCounts = {
    ON_HOLD: 0,
    ETP_DONE: 0,
    LOADING_SLIP_SENT: 0,
    INVOICE_GENERATING: 0,
    NOT_REGISTERED: 0,
    ETP_INVOICE_DONE: 0,
};

const STAT_CARDS: { heading: string; key: keyof VehicleStatCounts }[] = [
    { heading: "Today Vehicle's", key: "todayVehicles" },
    { heading: "Previous Day Vehicle's", key: "previousPendingVehicles" },
    { heading: "Dispatched", key: "dispatchDone" },
    { heading: "Waiting For Detail's", key: "waitingForDetails" },
    { heading: "On Hold", key: "onHold" },
];

/* Chip order in the alerts section. Colours come from STATUS_META. */
const ALERT_CHIPS: { label: string; status: AlertStatus }[] = [
    { label: "On Hold", status: "ON_HOLD" },
    { label: "ETP Done", status: "ETP_DONE" },
    { label: "Loading Slip", status: "LOADING_SLIP_SENT" },
    { label: "Invoice Generating", status: "INVOICE_GENERATING" },
    { label: "Not Registered", status: "NOT_REGISTERED" },
    { label: "ETP Invoice Done", status: "ETP_INVOICE_DONE" },
];

/* Roles that see the stat cards only - no alerts, no modals. */
const NO_ALERT_ROLES = ["welspun", "evonith", "shreecement"];

/* =========================================================
   HELPERS
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

const convertVehicleToVehicleNew = (vehicle: Vehicle): Vehicle_new =>
    ({
        ...vehicle,
        netWeight:
            vehicle.netWeight !== undefined &&
            vehicle.netWeight !== null &&
            vehicle.netWeight !== ""
                ? Number(vehicle.netWeight)
                : undefined,
    }) as Vehicle_new;

/* =========================================================
   SUB COMPONENTS
========================================================= */

const AlertHeader = ({ total }: { total: number }) => (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
            <h2 className="text-lg font-bold text-gray-900">
                Vehicle Alerts
            </h2>

            <p className="text-xs text-gray-500">
                Vehicles requiring attention
            </p>
        </div>

        <div className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600">
            Total: {total}
        </div>
    </div>
);

const AlertCountChips = ({ counts }: { counts: VehicleAlertCounts }) => (
    <div className="mb-4 flex flex-wrap gap-2">
        {ALERT_CHIPS.map(({ label, status }) => {
            const meta = getStatusMeta(status);

            return (
                <div
                    key={status}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${meta.pill}`}
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                        aria-hidden="true"
                    />
                    {label}: {counts[status]}
                </div>
            );
        })}
    </div>
);

const AlertMessage = ({
    text,
    dashed = false,
}: {
    text: string;
    dashed?: boolean;
}) => (
    <div
        className={`rounded-xl border bg-gray-50 px-4 py-10 text-center ${
            dashed ? "border-dashed border-gray-200" : "border-gray-100"
        }`}
    >
        <p className="text-sm font-medium text-gray-500">{text}</p>
    </div>
);

const AlertVehicleGrid = ({
    vehicles,
    onVehicleClick,
}: {
    vehicles: Vehicle[];
    onVehicleClick: (vehicle: Vehicle) => void;
}) => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((vehicle, index) => (
            <CommonVehicleStatusCard
                key={vehicle._id || `${vehicle.vehicleNo}-${index}`}
                sno={vehicle.sno ?? index + 1}
                tokenNo={vehicle.tokenNo}
                vehicleNo={vehicle.vehicleNo}
                status={vehicle.status}
                vehicle={vehicle}
                onClick={() => onVehicleClick(vehicle)}
                showEdit={false}
                showGoogleChat={false}
            />
        ))}
    </div>
);

/* =========================================================
   COMPONENT
========================================================= */

const VehicleStats = () => {
    const [stats, setStats] = useState<VehicleStatCounts>(DEFAULT_STATS);
    const [alertVehicles, setAlertVehicles] = useState<Vehicle[]>([]);
    const [alertCounts, setAlertCounts] =
        useState<VehicleAlertCounts>(DEFAULT_ALERT_COUNTS);
    const [loading, setLoading] = useState(true);

    /* null until localStorage has been read on the client. */
    const [userRole, setUserRole] = useState<string | null>(null);

    const [selectedVehicle, setSelectedVehicle] =
        useState<Vehicle_new | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const showVehicleAlerts =
        userRole !== null && !NO_ALERT_ROLES.includes(userRole);

    /* ---------------- ROLE ---------------- */

    useEffect(() => {
        setUserRole(getUserRole());
    }, []);

    /* ---------------- FETCH ---------------- */

    const fetchStats = useCallback(
        async (isCancelled: () => boolean = () => false) => {
            try {
                setLoading(true);

                const response = await fetch("/api/vehicles/stats", {
                    method: "GET",
                    cache: "no-store",
                });

                const result: VehicleStatsResponse = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Failed to fetch vehicle stats",
                    );
                }

                if (isCancelled() || !result.success) {
                    return;
                }

                setStats({ ...DEFAULT_STATS, ...(result.counts || {}) });

                /* Only keep alert data for roles allowed to see it. */
                if (showVehicleAlerts) {
                    setAlertVehicles(result.vehicleAlerts?.vehicles || []);
                    setAlertCounts({
                        ...DEFAULT_ALERT_COUNTS,
                        ...(result.vehicleAlerts?.counts || {}),
                    });
                } else {
                    setAlertVehicles([]);
                    setAlertCounts(DEFAULT_ALERT_COUNTS);
                }
            } catch (error) {
                console.error("Vehicle stats error:", error);

                if (!isCancelled()) {
                    setStats(DEFAULT_STATS);
                    setAlertVehicles([]);
                    setAlertCounts(DEFAULT_ALERT_COUNTS);
                }
            } finally {
                if (!isCancelled()) {
                    setLoading(false);
                }
            }
        },
        [showVehicleAlerts],
    );

    useEffect(() => {
        if (userRole === null) {
            return;
        }

        let cancelled = false;

        fetchStats(() => cancelled);

        return () => {
            cancelled = true;
        };
    }, [userRole, fetchStats]);

    /* ---------------- MODAL HANDLERS ---------------- */

    const handleVehicleClick = (vehicle: Vehicle) => {
        if (!showVehicleAlerts) {
            return;
        }

        setSelectedVehicle(convertVehicleToVehicleNew(vehicle));
        setIsEditModalOpen(false);
        setIsViewModalOpen(true);
    };

    /* Keep selectedVehicle so EditModal can open with it. */
    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
    };

    const handleEditVehicle = () => {
        if (!selectedVehicle || !showVehicleAlerts) {
            return;
        }

        setIsViewModalOpen(false);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedVehicle(null);
    };

    /* Refetch so counts and alerts reflect the new status. */
    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        setSelectedVehicle(null);
        fetchStats();
    };

    /* ---------------- RENDER ---------------- */

    return (
        <>
            <div className="w-full space-y-5">
                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 xl:gap-4">
                    {STAT_CARDS.map(({ heading, key }) => (
                        <CommonCard
                            key={key}
                            heading={heading}
                            number={loading ? 0 : stats[key]}
                        />
                    ))}
                </div>

                {showVehicleAlerts && (
                    <div className="w-full">
                        <AlertHeader
                            total={loading ? 0 : alertVehicles.length}
                        />

                        <AlertCountChips counts={alertCounts} />

                        {loading ? (
                            <AlertMessage text="Loading vehicle alerts..." />
                        ) : alertVehicles.length === 0 ? (
                            <AlertMessage text="No vehicle alerts" dashed />
                        ) : (
                            <AlertVehicleGrid
                                vehicles={alertVehicles}
                                onVehicleClick={handleVehicleClick}
                            />
                        )}
                    </div>
                )}
            </div>

            {showVehicleAlerts && (
                <>
                    <ViewModal
                        vehicle={selectedVehicle}
                        isOpen={isViewModalOpen}
                        onClose={handleCloseViewModal}
                        onEdit={handleEditVehicle}
                    />

                    <EditModal
                        vehicle={selectedVehicle}
                        isOpen={isEditModalOpen}
                        onClose={handleCloseEditModal}
                        onSuccess={handleEditSuccess}
                    />
                </>
            )}
        </>
    );
};

export default VehicleStats;
