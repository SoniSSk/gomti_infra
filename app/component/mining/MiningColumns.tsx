import React from "react";
import { Eye, Pencil } from "lucide-react";

import {
    WEIGHT_UNIT,
    needsMiningReason,
    type MiningObject,
} from "@/app/types/mining";
import type { ExportColumn } from "@/app/utils/tableExport";
import { TableColumn } from "../vehicle_new/common/CommonTable";
import CommonButton from "../vehicle_new/common/CommonButton";
import { formatDateTime } from "../vehicle_new/common/dateTime";
import { formatStatus } from "../vehicle_new/common/vehicleStatus";
import { MiningStatusBadge } from "./miningStatus";

/* =========================================================
   HELPERS
========================================================= */

/* Dates arrive from the API as ISO strings, but the type allows Date. */
export const formatMiningDate = (value?: Date | string): string =>
    formatDateTime(value instanceof Date ? value.toISOString() : value);

/** "12.5 MT", or "" when there's no weight. */
export const formatWeight = (value?: number | null): string =>
    typeof value === "number" && Number.isFinite(value)
        ? `${value.toLocaleString("en-IN", { maximumFractionDigits: 3 })} ${WEIGHT_UNIT}`
        : "";

/* =========================================================
   EXPORT COLUMNS

   The table packs several fields into one cell, so the
   export lists them out individually.
========================================================= */

export const miningExportColumns: ExportColumn<MiningObject>[] = [
    { label: "S.No", value: (row) => row.sno },
    { label: "Vehicle No", value: (row) => row.vehicleNo },
    { label: "Status", value: (row) => formatStatus(row.status) },
    { label: "Reason", value: (row) => row.cancelReason },
    { label: "Type of Mining", value: (row) => row.miningType },
    { label: "Lot", value: (row) => row.lot },
    { label: "Size", value: (row) => row.size },
    { label: "Loading Point", value: (row) => row.loadingPoint },
    { label: "Loading Person", value: (row) => row.loadingPerson },
    { label: "Loaded At", value: (row) => formatMiningDate(row.loadedAt) },
    { label: "Unloading Point", value: (row) => row.unloadingPoint },
    { label: "Unloading Person", value: (row) => row.unloadingPerson },
    { label: "Unloaded At", value: (row) => formatMiningDate(row.unloadedAt) },
    { label: `Empty Weight (${WEIGHT_UNIT})`, value: (row) => row.emptyWeight },
    { label: `Loaded Weight (${WEIGHT_UNIT})`, value: (row) => row.loadedWeight },
    { label: `Actual Weight (${WEIGHT_UNIT})`, value: (row) => row.actualWeight },
    { label: "Weight Slip", value: (row) => row.weightSlip?.url },
    { label: "Files", value: (row) => row.files?.length ?? 0 },
    { label: "Created By", value: (row) => row.createdBy },
    { label: "Created At", value: (row) => formatMiningDate(row.createdAt) },
    { label: "Updated By", value: (row) => row.updatedBy },
    { label: "Updated At", value: (row) => formatMiningDate(row.updatedAt) },
];

/* =========================================================
   CELLS
========================================================= */

/* Point, then person and time underneath; "—" when empty. */
const PointCell = ({
    point,
    person,
    at,
}: {
    point?: string;
    person?: string;
    at?: Date | string;
}) => {
    const time = formatMiningDate(at);

    return (
        <div className="flex max-w-[180px] flex-col">
            <span className={point ? "truncate text-gray-900" : "text-gray-300"} title={point}>
                {point || "—"}
            </span>
            {person && (
                <span className="truncate text-xs text-gray-500">{person}</span>
            )}
            {time && (
                <span className="whitespace-nowrap text-[11px] tabular-nums leading-4 text-gray-400">
                    {time}
                </span>
            )}
        </div>
    );
};

/* Actual weight large, loaded / empty underneath. */
const WeightCell = ({ row }: { row: MiningObject }) => {
    const actual = formatWeight(row.actualWeight);
    const loaded = formatWeight(row.loadedWeight);
    const empty = formatWeight(row.emptyWeight);

    return (
        <div className="flex flex-col whitespace-nowrap tabular-nums">
            <span className={actual ? "font-semibold text-gray-900" : "text-gray-300"}>
                {actual || "—"}
            </span>
            {(loaded || empty) && (
                <span className="text-[11px] leading-4 text-gray-500">
                    {loaded || "—"} − {empty || "—"}
                </span>
            )}
        </div>
    );
};

/* =========================================================
   COLUMNS
========================================================= */

interface MiningColumnActions {
    onView?: (trip: MiningObject) => void;
    onEdit?: (trip: MiningObject) => void;
}

export const miningColumns = ({
    onView,
    onEdit,
}: MiningColumnActions = {}): TableColumn<MiningObject>[] => [
    {
        key: "sno",
        label: "#",
        width: "72px",
        // Phones: drop the row number so Vehicle is the first
        // (sticky) column.
        hideOnMobile: true,
    },

    /* Vehicle + type of mining */
    {
        key: "vehicleNo",
        label: "Vehicle",
        render: (row) => (
            <div className="flex max-w-[160px] flex-col sm:max-w-[200px]">
                <span className="font-semibold tracking-wide text-gray-900">
                    {row.vehicleNo || "-"}
                </span>
                {row.miningType && (
                    <span className="truncate text-xs text-gray-500">
                        {row.miningType}
                    </span>
                )}
            </div>
        ),
    },

    {
        key: "status",
        label: "Status",
        render: (row) => (
            <div className="flex flex-col items-start gap-1">
                <MiningStatusBadge status={row.status} />
                {needsMiningReason(row.status) && row.cancelReason && (
                    <span
                        className="max-w-[160px] truncate text-xs text-gray-500"
                        title={row.cancelReason}
                    >
                        {row.cancelReason}
                    </span>
                )}
            </div>
        ),
    },

    /* Lot + size */
    {
        key: "lot",
        label: "Lot",
        render: (row) => (
            <div className="flex flex-col whitespace-nowrap">
                <span className={row.lot ? "font-medium tracking-wide text-gray-900" : "text-gray-300"}>
                    {row.lot || "—"}
                </span>
                {row.size && (
                    <span className="text-xs text-gray-500">
                        Size{" "}
                        <span className="font-medium text-gray-700">{row.size}</span>
                    </span>
                )}
            </div>
        ),
    },

    {
        key: "loadingPoint",
        label: "Loading",
        render: (row) => (
            <PointCell
                point={row.loadingPoint}
                person={row.loadingPerson}
                at={row.loadedAt}
            />
        ),
    },

    {
        key: "unloadingPoint",
        label: "Unloading",
        render: (row) => (
            <PointCell
                point={row.unloadingPoint}
                person={row.unloadingPerson}
                at={row.unloadedAt}
            />
        ),
    },

    {
        key: "actualWeight",
        label: "Actual Weight",
        render: (row) => <WeightCell row={row} />,
    },

    /* Created at + by */
    {
        key: "createdAt",
        label: "Created",
        hideOnMobile: true,
        render: (row) => (
            <div className="flex flex-col whitespace-nowrap">
                <span className="tabular-nums text-gray-900">
                    {formatMiningDate(row.createdAt) || "—"}
                </span>
                {row.createdBy && (
                    <span className="text-[11px] leading-4 text-gray-400">
                        by {row.createdBy}
                    </span>
                )}
            </div>
        ),
    },

    /* View / Edit, same as the lab table */
    {
        key: "action",
        label: "Actions",
        align: "right",
        render: (row) => (
            <div
                className="flex items-center justify-end gap-1.5"
                onClick={(event) => {
                    event.stopPropagation();
                }}
            >
                {onView && (
                    <CommonButton
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        aria-label="View"
                        title="View"
                        onClick={(event) => {
                            event.stopPropagation();
                            onView(row);
                        }}
                    >
                        {/* Icon-only on phones to keep the row narrow */}
                        <span className="hidden sm:inline">View</span>
                    </CommonButton>
                )}

                {onEdit && (
                    <CommonButton
                        variant="secondary"
                        size="sm"
                        icon={Pencil}
                        aria-label="Edit"
                        title="Edit"
                        onClick={(event) => {
                            event.stopPropagation();
                            onEdit(row);
                        }}
                    >
                        <span className="hidden sm:inline">Edit</span>
                    </CommonButton>
                )}
            </div>
        ),
    },
];
