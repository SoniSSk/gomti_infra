import React from "react";
import { Vehicle_new } from "@/app/types/vehicle_new";
import { TableColumn } from "../common/CommonTable";

/* =========================================================
   STATUS STYLES
========================================================= */

export const statusStyles: Record<string, string> = {
    WAITING_FOR_DETAILS: "bg-red-100 text-red-700",
    ENTRY_DONE: "bg-blue-100 text-blue-700",
    LOADING_STARTED: "bg-orange-100 text-orange-700",
    LOADING_DONE: "bg-purple-100 text-purple-700",
    LOADING_SLIP_SENT: "bg-indigo-100 text-indigo-700",
    ETP_GENERATING: "bg-amber-100 text-amber-700",
    ETP_DONE: "bg-yellow-100 text-yellow-700",
    ETP_INVOICE_DONE: "bg-cyan-100 text-cyan-700",
    INVOICE_GENERATING: "bg-sky-100 text-sky-700",
    DISPATCH_DONE: "bg-green-100 text-green-700",
    NOT_REGISTERD: "bg-gray-100 text-gray-700",
};

/* =========================================================
   DEFAULT STATUS STYLE
========================================================= */

const DEFAULT_STATUS_STYLE =
    "bg-gray-100 text-gray-700";

/* =========================================================
   STATUS LABEL
========================================================= */

const getStatusLabel = (status?: string) => {
    if (!status) {
        return "-";
    }

    return String(status)
        .replaceAll("_", " ")
        .trim();
};

/* =========================================================
   MODAL CALLBACK TYPES
========================================================= */

interface VehicleColumnActions {
    onView?: (vehicle: Vehicle_new) => void;
    onEdit?: (vehicle: Vehicle_new) => void;
}

/* =========================================================
   VEHICLE COLUMNS
========================================================= */

export const vehicleColumns = ({
    onView,
    onEdit,
}: VehicleColumnActions = {}): TableColumn<Vehicle_new>[] => [
        /* =========================
           S.NO
        ========================= */

        {
            key: "sno",
            label: "S.No",
        },

        /* =========================
           TOKEN NO
        ========================= */

        {
            key: "tokenNo",
            label: "Token No",
        },

        /* =========================
           DATE & TIME
        ========================= */

        {
            key: "createdAt",
            label: "Date & Time",
        },

        /* =========================
           IN TIME
        ========================= */

        {
            key: "inTime",
            label: "In Time",
        },

        /* =========================
           OUT TIME
        ========================= */

        {
            key: "outTime",
            label: "Out Time",
        },

        /* =========================
           VEHICLE NO
        ========================= */

        {
            key: "vehicleNo",
            label: "Vehicle No",
        },

        /* =========================
           TRANSPORTER
        ========================= */

        {
            key: "transporterName",
            label: "Transporter",
        },

        /* =========================
           BUYER
        ========================= */

        {
            key: "buyerDetails",
            label: "Buyer",
        },

        /* =========================
           NET WEIGHT
        ========================= */

        {
            key: "netWeight",
            label: "Weight (MT)",
        },

        /* =========================
           DESTINATION
        ========================= */

        {
            key: "destination",
            label: "Destination",
        },



        /* =========================
           STATUS
        ========================= */

        {
            key: "status",
            label: "Status",

            render: (row) => {
                const status = String(
                    row.status ?? "",
                ).toUpperCase();

                const statusClass =
                    statusStyles[status] ??
                    DEFAULT_STATUS_STYLE;

                return (
                    <span
                        className={`
                        inline-flex
                        items-center
                        justify-center
                        whitespace-nowrap
                        rounded-full
                        px-3
                        py-1
                        text-xs
                        font-medium
                        ${statusClass}
                    `}
                    >
                        {getStatusLabel(status)}
                    </span>
                );
            },
        },
        /* =========================
          ACTION
       ========================= */

        {
            key: "action",
            label: "Action",

            render: (row) => {
                return (
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={(event) => {
                            event.stopPropagation();
                        }}
                    >
                        {/* VIEW BUTTON */}
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onView?.(row);
                            }}
                            className="
                            rounded-md
                            border
                            border-blue-200
                            bg-blue-50
                            px-3
                            cursor-pointer
                            py-1.5
                            text-xs
                            font-medium
                            text-blue-700
                            transition
                            hover:bg-blue-100
                            active:scale-95
                        "
                        >
                            View
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit?.(row);
                            }}
                            className="
                            rounded-md
                            border
                            border-orange-200
                            bg-orange-50
                            px-3
                            py-1.5
                            cursor-pointer
                            text-xs
                            font-medium
                            text-orange-700
                            transition
                            hover:bg-orange-100
                            active:scale-95
                        "
                        >
                            Edit
                        </button>
                    </div>
                );
            },
        },
    ];