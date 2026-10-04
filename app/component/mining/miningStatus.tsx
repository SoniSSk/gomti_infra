import React from "react";

import type { MiningStatus } from "@/app/types/mining";
import {
    StatusMeta,
    formatStatus,
} from "../vehicle_new/common/vehicleStatus";

/*
 * How a mining trip status looks everywhere. Same pill style as the
 * vehicle StatusBadge, with mining-specific colours.
 */

export const MINING_STATUS_META: Record<MiningStatus, StatusMeta> = {
    EMPTY_WEIGHT: { pill: "bg-slate-50 text-slate-700 ring-slate-600/15", dot: "bg-slate-500" },
    LOADING: { pill: "bg-amber-50 text-amber-700 ring-amber-600/15", dot: "bg-amber-500" },
    LOADED_WEIGHT: { pill: "bg-violet-50 text-violet-700 ring-violet-600/15", dot: "bg-violet-500" },
    IN_TRANSIT: { pill: "bg-blue-50 text-blue-700 ring-blue-600/15", dot: "bg-blue-500" },
    UNLOADING: { pill: "bg-green-50 text-green-700 ring-green-600/15", dot: "bg-green-500" },
    CANCELLED: { pill: "bg-gray-100 text-gray-700 ring-gray-500/15", dot: "bg-gray-400" },
    ON_HOLD: { pill: "bg-red-50 text-red-700 ring-red-600/15", dot: "bg-red-500" },
};

export const getMiningStatusMeta = (status?: string): StatusMeta =>
    MINING_STATUS_META[String(status ?? "").toUpperCase() as MiningStatus] ??
    MINING_STATUS_META.CANCELLED;

export const MiningStatusBadge = ({ status }: { status?: string }) => {
    const meta = getMiningStatusMeta(status);

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
