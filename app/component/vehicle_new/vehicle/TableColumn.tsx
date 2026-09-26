import React from "react";
import { Eye, Pencil } from "lucide-react";
import { Vehicle_new } from "@/app/types/vehicle_new";
import { TableColumn } from "../common/CommonTable";
import CommonButton from "../common/CommonButton";
import { StatusBadge } from "../common/vehicleStatus";

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
    ===================================================== */

    const columns: TableColumn<Vehicle_new>[] = [
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
            render: (row) => (
                <span className="font-semibold tracking-wide text-gray-900">
                    {row.vehicleNo || "-"}
                </span>
            ),
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
            align: "right",
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

            render: (row) => (
                <StatusBadge status={String(row.status ?? "")} />
            ),
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
        label: "Action",

        render: (row) => (
            <div
                className="flex items-center gap-1.5"
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