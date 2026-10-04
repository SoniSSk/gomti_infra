"use client";

import React, { useMemo } from "react";

import CommonCard from "../vehicle_new/common/CommonCard";

import type { BusinessOperation, OperationStatus } from "@/app/types/accounts";
import { OPERATION_STATUS_META } from "./accountsStatus";

/*
 * Status summary above the accounts table, styled like the lab
 * stat cards. Counts come from the records loaded for the current
 * date filter; clicking a card filters the table.
 */

const SUMMARY_STATUSES: OperationStatus[] = [
    "Pending",
    "In Progress",
    "Awaiting Documents",
    "Correction Required",
    "Completed",
];

const ACTIVE_CARD = "border-orange-400 ring-2 ring-orange-200";

interface AccountsStatsProps {
    operations: BusinessOperation[];
    loading?: boolean;
    error?: boolean;
    activeStatus: OperationStatus | null;
    onStatusChange: (status: OperationStatus | null) => void;
}

const AccountsStats = ({
    operations,
    loading = false,
    error = false,
    activeStatus,
    onStatusChange,
}: AccountsStatsProps) => {
    const counts = useMemo(() => {
        const result = new Map<string, number>();

        operations.forEach(({ status }) => {
            const value = status?.value ?? "";
            result.set(value, (result.get(value) ?? 0) + 1);
        });

        return result;
    }, [operations]);

    const display = (value: number) => (error ? "—" : value);

    return (
        <div
            className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6"
            role="group"
            aria-label="Filter accounts entries by status"
        >
            <CommonCard
                heading="Total"
                accent="bg-orange-500"
                loading={loading}
                number={display(operations.length)}
                onClick={() => onStatusChange(null)}
                className={activeStatus === null ? ACTIVE_CARD : ""}
            />

            {SUMMARY_STATUSES.map((status) => {
                const active = activeStatus === status;

                return (
                    <CommonCard
                        key={status}
                        heading={status}
                        accent={OPERATION_STATUS_META[status].dot}
                        loading={loading}
                        number={display(counts.get(status) ?? 0)}
                        onClick={() => onStatusChange(active ? null : status)}
                        className={active ? ACTIVE_CARD : ""}
                    />
                );
            })}
        </div>
    );
};

export default AccountsStats;
