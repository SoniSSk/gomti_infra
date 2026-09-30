import React from "react";

import type { LabStatus } from "@/app/types/lab";
import {
    StatusMeta,
    formatStatus,
} from "../vehicle_new/common/vehicleStatus";

/*
 * How a lab status looks everywhere. Same pill style as the
 * vehicle StatusBadge, with lab-specific colours.
 */

export const LAB_STATUS_META: Record<LabStatus, StatusMeta> = {
    WAITING_FOR_DETAILS: { pill: "bg-red-50 text-red-700 ring-red-600/15", dot: "bg-red-500" },
    ON_HOLD: { pill: "bg-rose-50 text-rose-700 ring-rose-600/15", dot: "bg-rose-500" },
    SAMPLE_TAKEN: { pill: "bg-blue-50 text-blue-700 ring-blue-600/15", dot: "bg-blue-500" },
    REPORT_PENDING: { pill: "bg-amber-50 text-amber-700 ring-amber-600/15", dot: "bg-amber-500" },
    REPORT_DELAYED: { pill: "bg-orange-50 text-orange-700 ring-orange-600/15", dot: "bg-orange-500" },
    REPORT_DONE: { pill: "bg-green-50 text-green-700 ring-green-600/15", dot: "bg-green-500" },
    CANCELLED: { pill: "bg-gray-100 text-gray-700 ring-gray-500/15", dot: "bg-gray-400" },
};

export const getLabStatusMeta = (status?: string): StatusMeta =>
    LAB_STATUS_META[String(status ?? "").toUpperCase() as LabStatus] ??
    LAB_STATUS_META.CANCELLED;

export const LabStatusBadge = ({ status }: { status?: string }) => {
    const meta = getLabStatusMeta(status);

    return (
        <span
            className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.pill}`}
        >
            <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`}
                aria-hidden="true"
            />
            <span className="min-w-0 truncate">
                {formatStatus(status)}
            </span>
        </span>
    );
};
