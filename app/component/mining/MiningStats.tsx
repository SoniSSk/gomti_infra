"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import CommonCard from "../vehicle_new/common/CommonCard";
import { formatStatus } from "../vehicle_new/common/vehicleStatus";

import {
    type MiningObject,
    type MiningStatus,
} from "@/app/types/mining";
import { MINING_STATUS_META } from "./miningStatus";
import { formatWeight } from "./MiningColumns";

/*
 * Summary above the mining table, styled like the lab stat cards.
 * Counts come from the trips loaded for the current date filter;
 * clicking a status card filters the table.
 */

const STAT_STATUSES: MiningStatus[] = ["CANCELLED", "ON_HOLD"];

interface TypeWeight {
    type: string;
    trips: number;
    weight: number;
}

const ACTIVE_CARD = "border-orange-400 ring-2 ring-orange-200";

interface MiningStatsProps {
    trips: MiningObject[];
    loading?: boolean;
    error?: boolean;
    activeStatus: MiningStatus | null;
    onStatusChange: (status: MiningStatus | null) => void;
}

const MiningStats = ({
    trips,
    loading = false,
    error = false,
    activeStatus,
    onStatusChange,
}: MiningStatsProps) => {
    const { counts, unloadedTotal, unloadedByType } = useMemo(() => {
        const result = Object.fromEntries(
            STAT_STATUSES.map((status) => [status, 0]),
        ) as Record<MiningStatus, number>;

        const weights = new Map<string, TypeWeight>();
        let total = 0;

        trips.forEach((trip) => {
            const status = String(trip.status ?? "").toUpperCase() as MiningStatus;

            if (status in result) {
                result[status] += 1;
            }

            // Only delivered material counts towards the total
            if (status === "UNLOADING" && typeof trip.actualWeight === "number") {
                const type = trip.miningType?.trim() || "Other";

                const entry = weights.get(type) ?? { type, trips: 0, weight: 0 };

                entry.trips += 1;
                entry.weight += trip.actualWeight;
                weights.set(type, entry);
                total += trip.actualWeight;
            }
        });

        // Only types that actually have unloaded weight, heaviest first
        const byType = [...weights.values()]
            .filter(({ weight }) => weight > 0)
            .sort((a, b) => b.weight - a.weight);

        return { counts: result, unloadedTotal: total, unloadedByType: byType };
    }, [trips]);

    const display = (value: number) => (error ? "—" : value);

    /* Breakdown popover for the unloaded weight card */
    const [breakdownOpen, setBreakdownOpen] = useState(false);
    const breakdownRef = useRef<HTMLDivElement>(null);
    const hasBreakdown = !loading && !error && unloadedByType.length > 0;

    useEffect(() => {
        if (!breakdownOpen) {
            return;
        }

        const handleClick = (event: MouseEvent) => {
            if (!breakdownRef.current?.contains(event.target as Node)) {
                setBreakdownOpen(false);
            }
        };

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setBreakdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);

        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [breakdownOpen]);

    // Close it if the data under it goes away (refetch, error)
    useEffect(() => {
        if (!hasBreakdown) {
            setBreakdownOpen(false);
        }
    }, [hasBreakdown]);

    return (
        <div
            className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
            role="group"
            aria-label="Filter mining trips by status"
        >
            <CommonCard
                heading="Total Trips"
                accent="bg-orange-500"
                loading={loading}
                number={display(trips.length)}
                onClick={() => onStatusChange(null)}
                className={activeStatus === null ? ACTIVE_CARD : ""}
            />

            {STAT_STATUSES.map((status) => {
                const active = activeStatus === status;

                return (
                    <CommonCard
                        key={status}
                        heading={formatStatus(status)}
                        accent={MINING_STATUS_META[status].dot}
                        loading={loading}
                        number={display(counts[status])}
                        onClick={() => onStatusChange(active ? null : status)}
                        className={active ? ACTIVE_CARD : ""}
                    />
                );
            })}

            <div ref={breakdownRef} className={`relative ${breakdownOpen ? "z-40" : ""}`}>
                <CommonCard
                    heading="Unloaded Weight"
                    accent="bg-emerald-600"
                    loading={loading}
                    number={error ? "—" : formatWeight(unloadedTotal)}
                    description={
                        hasBreakdown
                            ? `${unloadedByType.length} ${unloadedByType.length === 1 ? "type" : "types"} · View breakdown`
                            : "Actual weight of trips at unloading"
                    }
                    onClick={hasBreakdown ? () => setBreakdownOpen((open) => !open) : undefined}
                    className={`h-full ${breakdownOpen ? ACTIVE_CARD : ""}`}
                />

                {breakdownOpen && (
                    <div
                        role="dialog"
                        aria-label="Unloaded weight by type of mining"
                        className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                    >
                        <div className="max-h-72 overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Type of Mining</th>
                                        <th className="px-3 py-2 text-right font-medium">Trips</th>
                                        <th className="px-3 py-2 text-right font-medium">Weight</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {unloadedByType.map(({ type, trips: tripCount, weight }) => (
                                        <tr key={type}>
                                            <td className="max-w-[150px] truncate px-3 py-2 text-gray-700" title={type}>
                                                {type}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                                                {tripCount}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums text-gray-900">
                                                {formatWeight(weight)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900">
                            <span>Total</span>
                            <span className="tabular-nums">{formatWeight(unloadedTotal)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MiningStats;
