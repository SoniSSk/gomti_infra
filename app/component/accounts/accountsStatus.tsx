import React from "react";

import type { OperationStatus, Priority } from "@/app/types/accounts";
import type { StatusMeta } from "../vehicle_new/common/vehicleStatus";

/*
 * How an accounts status looks everywhere. Same pill style as the
 * vehicle and lab badges, with accounts-specific colours.
 */

export const OPERATION_STATUS_META: Record<OperationStatus, StatusMeta> = {
    "Pending": { pill: "bg-amber-50 text-amber-700 ring-amber-600/15", dot: "bg-amber-500" },
    "Zoho Entry Done": { pill: "bg-teal-50 text-teal-700 ring-teal-600/15", dot: "bg-teal-500" },
    "On Hold": { pill: "bg-rose-50 text-rose-700 ring-rose-600/15", dot: "bg-rose-500" },
    "Under Review": { pill: "bg-indigo-50 text-indigo-700 ring-indigo-600/15", dot: "bg-indigo-500" },
    "In Progress": { pill: "bg-blue-50 text-blue-700 ring-blue-600/15", dot: "bg-blue-500" },
    "Partially Completed": { pill: "bg-lime-50 text-lime-800 ring-lime-600/20", dot: "bg-lime-500" },
    "Correction Required": { pill: "bg-orange-50 text-orange-700 ring-orange-600/15", dot: "bg-orange-500" },
    "Rejected": { pill: "bg-red-50 text-red-700 ring-red-600/15", dot: "bg-red-500" },
    "Cancelled": { pill: "bg-gray-100 text-gray-700 ring-gray-500/15", dot: "bg-gray-400" },
    "Completed": { pill: "bg-green-50 text-green-700 ring-green-600/15", dot: "bg-green-500" },
    "Awaiting Approval": { pill: "bg-purple-50 text-purple-700 ring-purple-600/15", dot: "bg-purple-500" },
    "Awaiting Documents": { pill: "bg-yellow-50 text-yellow-800 ring-yellow-600/20", dot: "bg-yellow-500" },
    "Duplicate": { pill: "bg-slate-100 text-slate-700 ring-slate-500/15", dot: "bg-slate-400" },
    "Not Applicable": { pill: "bg-gray-100 text-gray-600 ring-gray-500/15", dot: "bg-gray-300" },
};

export const getOperationStatusMeta = (status?: string): StatusMeta =>
    OPERATION_STATUS_META[status as OperationStatus] ??
    OPERATION_STATUS_META["Not Applicable"];

const Pill = ({ meta, children }: { meta: StatusMeta; children: React.ReactNode }) => (
    <span
        className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.pill}`}
    >
        <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`}
            aria-hidden="true"
        />
        <span className="min-w-0 truncate">{children}</span>
    </span>
);

export const OperationStatusBadge = ({ status }: { status?: string }) => (
    <Pill meta={getOperationStatusMeta(status)}>{status || "-"}</Pill>
);

const PRIORITY_META: Record<Priority, StatusMeta> = {
    Low: { pill: "bg-gray-100 text-gray-600 ring-gray-500/15", dot: "bg-gray-400" },
    Medium: { pill: "bg-blue-50 text-blue-700 ring-blue-600/15", dot: "bg-blue-500" },
    High: { pill: "bg-orange-50 text-orange-700 ring-orange-600/15", dot: "bg-orange-500" },
    Urgent: { pill: "bg-red-50 text-red-700 ring-red-600/15", dot: "bg-red-500" },
};

export const PriorityBadge = ({ priority }: { priority?: string }) => {
    const meta = PRIORITY_META[priority as Priority];

    return meta ? <Pill meta={meta}>{priority}</Pill> : null;
};
