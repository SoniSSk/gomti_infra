"use client";

import React, { useMemo } from "react";

import CommonCard from "../vehicle_new/common/CommonCard";
import { formatStatus } from "../vehicle_new/common/vehicleStatus";

import type { LabObject, LabStatus } from "@/app/types/lab";
import { LAB_STATUS_META } from "./labStatus";

/*
 * Status summary above the lab table, styled like the vehicle
 * stat cards. Counts come from the records loaded for the
 * current date filter; clicking a card filters the table.
 */

const LAB_STATUSES: LabStatus[] = [
    "ON_HOLD",
    "REPORT_DELAYED",
    "REPORT_DONE",
];

const ACTIVE_CARD = "border-orange-400 ring-2 ring-orange-200";

interface LabStatsProps {
    labs: LabObject[];
    loading?: boolean;
    error?: boolean;
    activeStatus: LabStatus | null;
    onStatusChange: (status: LabStatus | null) => void;
}

const LabStats = ({
    labs,
    loading = false,
    error = false,
    activeStatus,
    onStatusChange,
}: LabStatsProps) => {
    const counts = useMemo(() => {
        const result = Object.fromEntries(
            LAB_STATUSES.map((status) => [status, 0]),
        ) as Record<LabStatus, number>;

        labs.forEach((lab) => {
            const status = String(lab.status ?? "").toUpperCase() as LabStatus;

            if (status in result) {
                result[status] += 1;
            }
        });

        return result;
    }, [labs]);

    const display = (value: number) => (error ? "—" : value);

    return (
        <div
            className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
            role="group"
            aria-label="Filter lab records by status"
        >
            <CommonCard
                heading="Total"
                accent="bg-orange-500"
                loading={loading}
                number={display(labs.length)}
                onClick={() => onStatusChange(null)}
                className={activeStatus === null ? ACTIVE_CARD : ""}
            />

            {LAB_STATUSES.map((status) => {
                const active = activeStatus === status;

                return (
                    <CommonCard
                        key={status}
                        heading={formatStatus(status)}
                        accent={LAB_STATUS_META[status].dot}
                        loading={loading}
                        number={display(counts[status])}
                        onClick={() => onStatusChange(active ? null : status)}
                        className={active ? ACTIVE_CARD : ""}
                    />
                );
            })}
        </div>
    );
};

export default LabStats;
