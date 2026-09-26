import React from "react";
import { Eye, MapPin, Pencil } from "lucide-react";
import { Vehicle_new } from "@/app/types/vehicle_new";
import { TableColumn, formatWeight } from "../common/CommonTable";
import CommonButton from "../common/CommonButton";
import { StatusBadge, formatStatus } from "../common/vehicleStatus";
import { formatDateTime, formatRelativeTime } from "../common/dateTime";
import type { ExportColumn } from "@/app/utils/tableExport";
import { getLastStatusChange } from "@/app/utils/lastStatusChange";
import {
    canModifyVehicle,
    canViewVehicle,
    getStoredUserRole,
} from "@/app/utils/vehiclePermissions";

/* =========================================================
   MODAL CALLBACK TYPES
========================================================= */

interface VehicleColumnActions {
    onView?: (vehicle: Vehicle_new) => void;
    onEdit?: (vehicle: Vehicle_new) => void;
}

/* =========================================================
   VEHICLE EXPORT COLUMNS

   The table packs several fields into one cell, so the
   export lists them out individually.
========================================================= */

const exportWeight = (value?: string): number | string => {
    const weight = Number(value);

    return value !== "" && value !== undefined && Number.isFinite(weight)
        ? weight
        : "";
};

export const vehicleExportColumns: ExportColumn<Vehicle_new>[] = [
    { label: "S.No", value: (row) => row.sno },
    { label: "Vehicle No", value: (row) => row.vehicleNo },
    { label: "Token No", value: (row) => row.tokenNo },
    { label: "Status", value: (row) => formatStatus(row.status) },
    { label: "Hold Reason", value: (row) => row.holdReason },
    {
        label: "Status Changed By",
        value: (row) => getLastStatusChange(row)?.user.name,
    },
    {
        label: "Status Changed At",
        value: (row) => formatDateTime(getLastStatusChange(row)?.at),
    },
    { label: "Buyer", value: (row) => row.buyerDetails },
    { label: "Destination", value: (row) => row.destination },
    { label: "Transporter", value: (row) => row.transporterName },
    { label: "Driver", value: (row) => row.driverName },
    { label: "Driver Contact", value: (row) => row.driverContact },
    { label: "Material", value: (row) => row.materialName },
    { label: "Grade", value: (row) => row.materialGrade },
    { label: "Net Weight (MT)", value: (row) => exportWeight(row.netWeight) },
    { label: "ETP No", value: (row) => row.etpNo },
    { label: "Created At", value: (row) => formatDateTime(row.createdAt) },
    { label: "In Time", value: (row) => formatDateTime(row.inTime) },
    { label: "Out Time", value: (row) => formatDateTime(row.outTime) },
];

/* =========================================================
   TIMELINE CELL

   Entry / In / Out stacked as relative times ("15m ago");
   the full timestamp shows on hover.
========================================================= */

const TIMELINE_ROWS: { label: string; value: (row: Vehicle_new) => string | undefined }[] = [
    { label: "Entry", value: (row) => row.createdAt },
    { label: "In", value: (row) => row.inTime },
    { label: "Out", value: (row) => row.outTime },
];

const TimelineCell = ({ row }: { row: Vehicle_new }) => (
    <div className="flex flex-col whitespace-nowrap text-xs leading-4 tabular-nums">
        {TIMELINE_ROWS.map(({ label, value }) => {
            const raw = value(row);
            const relative = formatRelativeTime(raw);

            return (
                <span key={label} title={formatDateTime(raw) || undefined}>
                    <span className="inline-block w-9 text-gray-400">{label}</span>
                    <span className={relative ? "text-gray-800" : "text-gray-300"}>
                        {relative || "—"}
                    </span>
                </span>
            );
        })}
    </div>
);

/* =========================================================
   VEHICLE COLUMNS
========================================================= */

export const vehicleColumns = ({
    onView,
    onEdit,
}: VehicleColumnActions = {}): TableColumn<Vehicle_new>[] => {

    const userRole = getStoredUserRole();

    /* =====================================================
       BASE COLUMNS

       Grouped by what a dispatcher scans for:
       identity -> status -> parties -> timing -> weight.
    ===================================================== */

    const columns: TableColumn<Vehicle_new>[] = [
        {
            key: "sno",
            label: "#",
            width: "56px",
        },

        /* Vehicle No + Token No */
        {
            key: "vehicleNo",
            label: "Vehicle",
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-semibold tracking-wide text-gray-900">
                        {row.vehicleNo || "-"}
                    </span>
                    <span className="text-xs text-gray-500">
                        Token{" "}
                        <span className="font-medium tabular-nums text-gray-700">
                            {row.tokenNo || "-"}
                        </span>
                    </span>
                </div>
            ),
        },

        {
            key: "status",
            label: "Status",
            render: (row) => {
                const change = getLastStatusChange(row);
                const changedAt = formatDateTime(change?.at);

                return (
                    <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={String(row.status ?? "")} />
                        {change && (
                            <span
                                className="max-w-[160px] truncate text-xs text-gray-500"
                                title={changedAt ? `Changed on ${changedAt}` : undefined}
                            >
                                by{" "}
                                <span className="font-medium text-gray-700">
                                    {change.user.name}
                                </span>
                            </span>
                        )}
                    </div>
                );
            },
        },

        /* Buyer + Destination */
        {
            key: "buyerDetails",
            label: "Buyer",
            render: (row) => (
                <div className="flex max-w-[240px] flex-col">
                    <span
                        className="truncate text-gray-900"
                        title={row.buyerDetails || undefined}
                    >
                        {row.buyerDetails || "-"}
                    </span>
                    {row.destination && (
                        <span
                            className="flex items-center gap-1 truncate text-xs text-gray-500"
                            title={row.destination}
                        >
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{row.destination}</span>
                        </span>
                    )}
                </div>
            ),
        },

        {
            key: "transporterName",
            label: "Transporter",
            hideOnMobile: true,
            render: (row) => (
                <span
                    className="block max-w-[200px] truncate"
                    title={row.transporterName || undefined}
                >
                    {row.transporterName || "-"}
                </span>
            ),
        },

        /* Entry / In / Out as relative times; full timestamp on hover */
        {
            key: "createdAt",
            label: "Timeline",
            render: (row) => <TimelineCell row={row} />,
        },

        {
            key: "netWeight",
            label: "Weight (MT)",
            align: "right",
            render: (row) => {
                const weight = Number(row.netWeight);

                return Number.isFinite(weight) && row.netWeight !== ""
                    ? (
                        <span className="font-medium text-gray-900">
                            {formatWeight(weight)}
                        </span>
                    )
                    : <span className="text-gray-300">—</span>;
            },
        },
    ];

    /* =====================================================
       ACTION COLUMN

       Customers (welspun, evonith, shreecement):
       - No actions (they only get their own vehicles)

       Employees:
       - View

       Admins / super admins:
       - View
       - Edit (dispatched vehicles: super admin only)
    ===================================================== */

    if (!canViewVehicle(userRole)) {
        return columns;
    }

    columns.push({
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
                <CommonButton
                    variant="secondary"
                    size="sm"
                    icon={Eye}
                    onClick={(event) => {
                        event.stopPropagation();
                        onView?.(row);
                    }}
                >
                    View
                </CommonButton>

                {/* Employees can't edit; dispatched vehicles: super admin only */}
                {canModifyVehicle(row.status, userRole) && (
                    <CommonButton
                        variant="secondary"
                        size="sm"
                        icon={Pencil}
                        onClick={(event) => {
                            event.stopPropagation();
                            onEdit?.(row);
                        }}
                    >
                        Edit
                    </CommonButton>
                )}
            </div>
        ),
    });

    return columns;
};