import React from "react";

/*
 * Single source of truth for how a vehicle status looks everywhere
 * (table, alert cards, alert filter chips).
 */

export interface StatusMeta {
    /** Pill background + text colour. */
    pill: string;
    /** Solid colour for dots / accent stripes. */
    dot: string;
}

export const STATUS_META: Record<string, StatusMeta> = {
    WAITING_FOR_DETAILS: { pill: "bg-red-50 text-red-700 ring-red-600/15", dot: "bg-red-500" },
    WAITING_FOR_TOKEN: { pill: "bg-yellow-50 text-yellow-800 ring-yellow-600/20", dot: "bg-yellow-500" },
    ENTRY_DONE: { pill: "bg-blue-50 text-blue-700 ring-blue-600/15", dot: "bg-blue-500" },
    LOADING_STARTED: { pill: "bg-orange-50 text-orange-700 ring-orange-600/15", dot: "bg-orange-500" },
    LOADING_DONE: { pill: "bg-purple-50 text-purple-700 ring-purple-600/15", dot: "bg-purple-500" },
    LOADING_SLIP_SENT: { pill: "bg-indigo-50 text-indigo-700 ring-indigo-600/15", dot: "bg-indigo-500" },
    ETP_GENERATING: { pill: "bg-amber-50 text-amber-700 ring-amber-600/15", dot: "bg-amber-500" },
    ETP_DONE: { pill: "bg-yellow-50 text-yellow-800 ring-yellow-600/20", dot: "bg-yellow-500" },
    ETP_INVOICE_DONE: { pill: "bg-cyan-50 text-cyan-700 ring-cyan-600/15", dot: "bg-cyan-500" },
    INVOICE_GENERATING: { pill: "bg-sky-50 text-sky-700 ring-sky-600/15", dot: "bg-sky-500" },
    DISPATCH_DONE: { pill: "bg-green-50 text-green-700 ring-green-600/15", dot: "bg-green-500" },
    NOT_REGISTERED: { pill: "bg-gray-100 text-gray-700 ring-gray-500/15", dot: "bg-gray-400" },
};

const DEFAULT_META: StatusMeta = STATUS_META.NOT_REGISTERED;

export const getStatusMeta = (status?: string): StatusMeta =>
    STATUS_META[String(status ?? "").toUpperCase()] ?? DEFAULT_META;

/** "LOADING_SLIP_SENT" -> "Loading Slip Sent"; ETP stays upper-case. */
export const formatStatus = (status?: string): string => {
    if (!status) {
        return "-";
    }

    return String(status)
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .replace(/\bEtp\b/g, "ETP");
};

export const StatusBadge = ({ status }: { status?: string }) => {
    const meta = getStatusMeta(status);

    return (
        <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.pill}`}
        >
            <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`}
                aria-hidden="true"
            />
            {formatStatus(status)}
        </span>
    );
};
