import React from "react";
import { Eye, Pencil } from "lucide-react";

import type { LabObject, LabReport } from "@/app/types/lab";
import type { ExportColumn } from "@/app/utils/tableExport";
import { TableColumn } from "../vehicle_new/common/CommonTable";
import CommonButton from "../vehicle_new/common/CommonButton";
import { formatDateTime } from "../vehicle_new/common/dateTime";
import { formatStatus } from "../vehicle_new/common/vehicleStatus";
import { LabStatusBadge } from "./labStatus";

/* =========================================================
   HELPERS
========================================================= */

/* Dates arrive from the API as ISO strings, but the type allows Date. */
export const formatLabDate = (value?: Date | string): string =>
    formatDateTime(value instanceof Date ? value.toISOString() : value);

const isNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

/* =========================================================
   REPORT FIELDS

   Order used by both the table cell and the export.
========================================================= */

/* label: short symbol for the table; name: full form for the report card. */
export const REPORT_FIELDS: {
    key: keyof LabReport;
    label: string;
    name: string;
}[] = [
    { key: "Fe", label: "Fe", name: "Iron" },
    { key: "Fe2O3", label: "Fe₂O₃", name: "Iron Oxide" },
    { key: "silica", label: "SiO₂", name: "Silica" },
    { key: "Al", label: "Al", name: "Aluminium" },
    { key: "Mn", label: "Mn", name: "Manganese" },
    { key: "phosphorus", label: "P", name: "Phosphorus" },
    { key: "LOI", label: "LOI", name: "Loss on Ignition" },
    { key: "specificGravity", label: "SG", name: "Specific Gravity" },
    { key: "specificDensity", label: "SD", name: "Specific Density" },
];

/** "Iron (Fe)" */
export const reportFieldLabel = ({
    label,
    name,
}: (typeof REPORT_FIELDS)[number]) => `${name} (${label})`;

/* =========================================================
   LAB EXPORT COLUMNS

   The table packs several fields into one cell, so the
   export lists them out individually.
========================================================= */

export const labExportColumns: ExportColumn<LabObject>[] = [
    { label: "S.No", value: (row) => row.sno },
    { label: "Lot", value: (row) => row.lot },
    { label: "Lot Description", value: (row) => row.lotDescription },
    { label: "Size", value: (row) => row.size },
    { label: "Status", value: (row) => formatStatus(row.status) },
    { label: "Hold Reason", value: (row) => row.holdReason },
    { label: "Cancel Reason", value: (row) => row.cancelReason },
    { label: "Assigned By", value: (row) => row.assignedBy },
    { label: "Assigned To", value: (row) => row.assignedTo },
    { label: "Sample Taken By", value: (row) => row.sampleTakenBy },
    { label: "Sample Taken At", value: (row) => formatLabDate(row.sampleTakenAt) },
    { label: "Expected Report At", value: (row) => formatLabDate(row.expectedReportAt) },
    { label: "Report Done At", value: (row) => formatLabDate(row.reportDoneAt) },
    ...REPORT_FIELDS.map(
        ({ key, label }): ExportColumn<LabObject> => ({
            label,
            value: (row) => row.report?.[key],
        }),
    ),
    { label: "Created By", value: (row) => row.createdBy },
    { label: "Created At", value: (row) => formatLabDate(row.createdAt) },
    { label: "Updated By", value: (row) => row.updatedBy },
    { label: "Updated At", value: (row) => formatLabDate(row.updatedAt) },
];

/* =========================================================
   CELLS
========================================================= */

/* Label + value stacked; "—" when empty. */
const StackedCell = ({
    primary,
    secondary,
}: {
    primary?: string;
    secondary?: React.ReactNode;
}) => (
    <div className="flex flex-col whitespace-nowrap">
        <span className={primary ? "text-gray-900" : "text-gray-300"}>
            {primary || "—"}
        </span>
        {secondary && (
            <span className="text-xs text-gray-500">{secondary}</span>
        )}
    </div>
);

/* Expected, then Done, each label above its date; Done is red when late. */
const ReportTimelineCell = ({ row }: { row: LabObject }) => {
    const expected = formatLabDate(row.expectedReportAt);
    const done = formatLabDate(row.reportDoneAt);

    const late =
        row.expectedReportAt &&
        row.reportDoneAt &&
        new Date(row.reportDoneAt) > new Date(row.expectedReportAt);

    return (
        <div className="flex flex-col gap-1 whitespace-nowrap tabular-nums text-[11px] leading-4">
            <div className="flex flex-col">
                <span className="text-[9px] uppercase leading-3 tracking-wide text-gray-400">Expected</span>
                <span className={expected ? "text-gray-900" : "text-gray-300"}>
                    {expected || "—"}
                </span>
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] uppercase leading-3 tracking-wide text-gray-400">Done</span>
                <span
                    className={
                        !done
                            ? "text-gray-300"
                            : late
                                ? "font-medium text-red-600"
                                : "text-gray-900"
                    }
                >
                    {done || "—"}
                </span>
            </div>
        </div>
    );
};

/* Only the assays that have a value, as a compact grid. */
const ReportCell = ({ report }: { report?: LabReport }) => {
    const values = REPORT_FIELDS.filter(({ key }) =>
        isNumber(report?.[key]),
    );

    if (!values.length) {
        return <span className="text-gray-300">—</span>;
    }

    return (
        <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 whitespace-nowrap text-xs tabular-nums">
            {values.map(({ key, label }) => (
                <span key={key}>
                    <span className="text-gray-500">{label}</span>{" "}
                    <span className="font-medium text-gray-900">
                        {report?.[key]}
                    </span>
                </span>
            ))}
        </div>
    );
};

/* =========================================================
   LAB COLUMNS
========================================================= */

interface LabColumnActions {
    onView?: (lab: LabObject) => void;
    onEdit?: (lab: LabObject) => void;
}

export const labColumns = ({
    onView,
    onEdit,
}: LabColumnActions = {}): TableColumn<LabObject>[] => [
    {
        key: "sno",
        label: "#",
        width: "72px",
        // Phones: drop the row number so Lot is the first
        // (sticky) column.
        hideOnMobile: true,
    },

    /* Lot + description + size */
    {
        key: "lot",
        label: "Lot",
        render: (row) => (
            <div className="flex max-w-[160px] flex-col sm:max-w-[240px]">
                <span className="font-semibold tracking-wide text-gray-900">
                    {row.lot || "-"}
                </span>
                {row.size && (
                    <span className="text-xs text-gray-500">
                        Size{" "}
                        <span className="font-medium text-gray-700">
                            {row.size}
                        </span>
                    </span>
                )}
            </div>
        ),
    },

    {
        key: "status",
        label: "Status",
        render: (row) => {
            const reason =
                row.status === "ON_HOLD"
                    ? row.holdReason
                    : row.status === "CANCELLED"
                        ? row.cancelReason
                        : undefined;

            return (
                <div className="flex flex-col items-start gap-1">
                    <LabStatusBadge status={row.status} />
                    {reason && (
                        <span
                            className="max-w-[160px] truncate text-xs text-gray-500"
                            title={reason}
                        >
                            {reason}
                        </span>
                    )}
                </div>
            );
        },
    },

    /* Assigned to, by whom */
    {
        key: "assignedTo",
        label: "Assigned",
        hideOnMobile: true,
        render: (row) => (
            <div className="flex flex-col whitespace-nowrap">
                <span
                    className={
                        row.assignedTo
                            ? "font-semibold text-gray-900"
                            : "text-gray-300"
                    }
                >
                    {row.assignedTo || "—"}
                </span>
                {row.assignedBy && (
                    <span className="text-[11px] leading-4 text-gray-400">
                        by {row.assignedBy}
                    </span>
                )}
            </div>
        ),
    },

    /* Sample taken by + when */
    {
        key: "sampleTakenAt",
        label: "Sample",
        render: (row) => (
            <StackedCell
                primary={row.sampleTakenBy}
                secondary={formatLabDate(row.sampleTakenAt) || undefined}
            />
        ),
    },

    {
        key: "expectedReportAt",
        label: "Report Timeline",
        render: (row) => <ReportTimelineCell row={row} />,
    },

    {
        key: "report",
        label: "Report",
        render: (row) => <ReportCell report={row.report} />,
    },

    /* Created at + by */
    {
        key: "createdAt",
        label: "Created",
        hideOnMobile: true,
        render: (row) => {
            const created = formatLabDate(row.createdAt);

            return (
                <span
                    className={`whitespace-nowrap tabular-nums ${created ? "text-gray-900" : "text-gray-300"}`}
                >
                    {created || "—"}
                </span>
            );
        },
    },

    /* View / Edit, same as the vehicle table */
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
