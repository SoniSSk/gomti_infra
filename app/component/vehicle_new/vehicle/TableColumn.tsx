import React from "react";
import { Eye, MapPin, Pencil } from "lucide-react";
import { Vehicle_new } from "@/app/types/vehicle_new";
import { TableColumn, formatWeight } from "../common/CommonTable";
import CommonButton from "../common/CommonButton";
import { StatusBadge } from "../common/vehicleStatus";
import { parseDateTime, type ParsedDateTime } from "../common/dateTime";

/* =========================================================
   MODAL CALLBACK TYPES
========================================================= */

interface VehicleColumnActions {
    onView?: (vehicle: Vehicle_new) => void;
    onEdit?: (vehicle: Vehicle_new) => void;
}

/* =========================================================
   READ ONLY ROLES
========================================================= */

const READ_ONLY_ROLES = [
    "welspun",
    "evonith",
    "shreecement",
];

/* =========================================================
   GET USER ROLE FROM LOCAL STORAGE
========================================================= */

const getUserRoleFromLocalStorage = (): string => {
    if (typeof window === "undefined") {
        return "";
    }

    const role = localStorage.getItem("userRole");

    return String(role ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
};

/* =========================================================
   VEHICLE COLUMNS
========================================================= */

export const vehicleColumns = ({
    onView,
    onEdit,
}: VehicleColumnActions = {}): TableColumn<Vehicle_new>[] => {

    /* =====================================================
       GET ROLE FROM LOCAL STORAGE
    ===================================================== */

    const userRole = getUserRoleFromLocalStorage();

    /* =====================================================
       CHECK READ ONLY ROLE
    ===================================================== */

    const isReadOnlyRole =
        READ_ONLY_ROLES.includes(userRole);

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
            render: (row) => (
                <StatusBadge status={String(row.status ?? "")} />
            ),
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

        /* Entry date + In / Out */
        {
            key: "createdAt",
            label: "Timeline",
            render: (row) => {
                const created = parseDateTime(row.createdAt);
                const inTime = parseDateTime(row.inTime);
                const outTime = parseDateTime(row.outTime);

                const showTime = (value: ParsedDateTime | null) => {
                    if (!value) {
                        return <span className="text-gray-300">—</span>;
                    }

                    return value.date === created?.date
                        ? value.time
                        : `${value.date}, ${value.time}`;
                };

                return (
                    <div className="flex flex-col">
                        <span className="text-gray-900">
                            {created
                                ? `${created.date}, ${created.time}`
                                : "-"}
                        </span>
                        <span className="text-xs tabular-nums text-gray-500">
                            In{" "}
                            <span className="text-gray-700">{showTime(inTime)}</span>
                            <span className="mx-1.5 text-gray-300">·</span>
                            Out{" "}
                            <span className="text-gray-700">{showTime(outTime)}</span>
                        </span>
                    </div>
                );
            },
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
       READ ONLY USERS
       
       welspun
       evonith
       shreecement
       
       No Action column
       No View
       No Edit
    ===================================================== */

    if (isReadOnlyRole) {
        return columns;
    }

    /* =====================================================
       ACTION COLUMN
       
       Other roles:
       - View
       - Edit
    ===================================================== */

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
            </div>
        ),
    });

    return columns;
};