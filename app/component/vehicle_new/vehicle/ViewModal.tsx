/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Vehicle_new } from "@/app/types/vehicle_new";
import { normalizeVehicle } from "@/app/utils/vehicleMapper";
import CommonFileUpload from "../common/CommonFileUpload";

interface ViewModalProps {
    vehicle: Vehicle_new | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
}

/* =========================================================
   DETAIL ITEM
========================================================= */

interface VehicleDetailItemProps {
    label: string;
    value?: string | number | null;
    icon?: React.ReactNode;
}

const VehicleDetailItem = ({
    label,
    value,
    icon,
}: VehicleDetailItemProps) => {
    const displayValue =
        value !== undefined &&
            value !== null &&
            value !== ""
            ? String(value)
            : "-";

    return (
        <div
            className="
                group
                relative
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                bg-white
                p-3.5
                transition-all
                duration-200
                hover:-translate-y-[1px]
                hover:border-orange-300
                hover:shadow-md
            "
        >
            <div
                className="
                    absolute
                    left-0
                    top-0
                    h-full
                    w-[3px]
                    bg-transparent
                    transition
                    group-hover:bg-orange-500
                "
            />

            <div className="flex items-start gap-3">
                {icon && (
                    <div
                        className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-gradient-to-br
                            from-orange-100
                            to-amber-50
                            text-orange-600
                        "
                    >
                        {icon}
                    </div>
                )}

                <div className="min-w-0">
                    <p
                        className="
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-[0.12em]
                            text-slate-400
                        "
                    >
                        {label}
                    </p>

                    <p
                        className="
                            mt-1
                            break-words
                            text-[13px]
                            font-semibold
                            leading-5
                            text-slate-700
                        "
                    >
                        {displayValue}
                    </p>
                </div>
            </div>
        </div>
    );
};

/* =========================================================
   SECTION
========================================================= */

const Section = ({
    number,
    title,
    children,
}: {
    number: string;
    title: string;
    children: React.ReactNode;
}) => {
    return (
        <section className="relative">
            <div className="mb-4 flex items-center gap-3">
                <div
                    className="
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-gradient-to-br
                        from-orange-600
                        to-amber-500
                        text-[10px]
                        font-bold
                        text-white
                        shadow-sm
                    "
                >
                    {number}
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-800">
                        {title}
                    </h3>

                    <div
                        className="
                            mt-1
                            h-[2px]
                            w-10
                            rounded-full
                            bg-gradient-to-r
                            from-orange-500
                            to-amber-400
                        "
                    />
                </div>
            </div>

            {children}
        </section>
    );
};

/* =========================================================
   STATUS
========================================================= */

const StatusBadge = ({
    status,
}: {
    status?: string;
}) => {
    let badgeClass =
        "border-slate-200 bg-slate-100 text-slate-600";

    let dotClass = "bg-slate-400";

    switch (status) {
        case "DISPATCH_DONE":
            badgeClass =
                "border-emerald-200 bg-emerald-50 text-emerald-700";
            dotClass = "bg-emerald-500";
            break;

        case "LOADING_STARTED":
            badgeClass =
                "border-orange-200 bg-orange-50 text-orange-700";
            dotClass = "bg-orange-500";
            break;

        case "LOADING_DONE":
            badgeClass =
                "border-blue-200 bg-blue-50 text-blue-700";
            dotClass = "bg-blue-500";
            break;

        case "ENTRY_DONE":
            badgeClass =
                "border-indigo-200 bg-indigo-50 text-indigo-700";
            dotClass = "bg-indigo-500";
            break;

        case "WAITING_FOR_DETAILS":
            badgeClass =
                "border-red-200 bg-red-50 text-red-700";
            dotClass = "bg-red-500";
            break;

        case "WAITING_FOR_TOKEN":
            badgeClass =
                "border-yellow-200 bg-yellow-50 text-yellow-700";
            dotClass = "bg-yellow-500";
            break;

        case "ETP_DONE":
        case "ETP_INVOICE_DONE":
            badgeClass =
                "border-purple-200 bg-purple-50 text-purple-700";
            dotClass = "bg-purple-500";
            break;

        case "NOT_REGISTERD":
            badgeClass =
                "border-red-200 bg-red-50 text-red-700";
            dotClass = "bg-red-500";
            break;

        case "LOADING_SLIP_SENT":
            badgeClass =
                "border-cyan-200 bg-cyan-50 text-cyan-700";
            dotClass = "bg-cyan-500";
            break;

        case "ETP_GENERATING":
            badgeClass =
                "border-violet-200 bg-violet-50 text-violet-700";
            dotClass = "bg-violet-500";
            break;

        case "INVOICE_GENERATING":
            badgeClass =
                "border-pink-200 bg-pink-50 text-pink-700";
            dotClass = "bg-pink-500";
            break;
    }

    return (
        <span
            className={`
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                px-3
                py-1.5
                text-[10px]
                font-bold
                shadow-sm
                ${badgeClass}
            `}
        >
            <span
                className={`
                    h-1.5
                    w-1.5
                    rounded-full
                    ${dotClass}
                `}
            />

            {status || "UNKNOWN"}
        </span>
    );
};

/* =========================================================
   DOCUMENT
========================================================= */

const DocumentItem = ({
    label,
    value,
}: {
    label: string;
    value?: string;
}) => {
    if (!value) {
        return (
            <div
                className="
                    rounded-xl
                    border
                    border-dashed
                    border-orange-200
                    bg-gradient-to-br
                    from-orange-50
                    to-amber-50
                    p-4
                "
            >
                <div className="flex items-center gap-3">
                    <div
                        className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-orange-100
                            text-orange-500
                        "
                    >
                        <span className="text-sm">📄</span>
                    </div>

                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                            {label}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-400">
                            Not uploaded
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="
                overflow-hidden
                rounded-xl
                border
                border-orange-200
                bg-white
                shadow-sm
            "
        >
            <CommonFileUpload
                label={label}
                value={value}
                disabled
                onChange={() => { }}
                maxSizeMB={100}
                className="w-full"
            />
        </div>
    );
};

/* =========================================================
   EMPTY
========================================================= */

const EmptyState = ({
    text,
}: {
    text: string;
}) => {
    return (
        <div
            className="
                rounded-xl
                border
                border-dashed
                border-orange-200
                bg-gradient-to-br
                from-orange-50
                to-amber-50
                px-5
                py-8
                text-center
            "
        >
            <div className="mb-2 text-xl">—</div>

            <p className="text-xs font-medium text-slate-400">
                {text}
            </p>
        </div>
    );
};

/* =========================================================
   TRACKING VALUE
========================================================= */

const formatTrackingValue = (
    value: unknown,
): string => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "-";
    }

    if (typeof value === "object") {
        return JSON.stringify(value, null, 2);
    }

    return String(value);
};

/* =========================================================
   COPY BUTTON
========================================================= */

const CopyButton = ({
    value,
}: {
    value?: string | number | null;
}) => {
    const [copied, setCopied] = React.useState(false);

    const disabled =
        value === undefined ||
        value === null ||
        value === "";

    const handleCopy = async () => {
        if (disabled) return;

        try {
            await navigator.clipboard.writeText(String(value));
            setCopied(true);

            window.setTimeout(() => {
                setCopied(false);
            }, 1200);
        } catch (error) {
            console.error("Copy failed:", error);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            disabled={disabled}
            title={
                disabled
                    ? "Nothing to copy"
                    : copied
                        ? "Copied"
                        : "Copy"
            }
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${disabled
                ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                : copied
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border-orange-100 bg-orange-50 text-orange-500 hover:border-orange-300 hover:bg-orange-100 hover:text-orange-700"
                }`}
        >
            {copied ? (
                <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                >
                    <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 010 1.42l-7.2 7.2a1 1 0 01-1.42 0l-3.2-3.2a1 1 0 111.42-1.42l2.49 2.49 6.49-6.49a1 1 0 011.42 0z"
                        clipRule="evenodd"
                    />
                </svg>
            ) : (
                <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-3.5 w-3.5"
                >
                    <rect
                        x="6"
                        y="6"
                        width="9"
                        height="9"
                        rx="1.5"
                    />
                    <path d="M4 13V4.5A1.5 1.5 0 015.5 3H13" />
                </svg>
            )}
        </button>
    );
};

/* =========================================================
   QUICK STAT
========================================================= */

const QuickStat = ({
    label,
    value,
}: {
    label: string;
    value?: string | number | null;
}) => {
    const displayValue =
        value !== undefined &&
            value !== null &&
            value !== ""
            ? String(value)
            : "-";

    return (
        <div className="group min-w-0 px-3 py-3 transition-colors hover:bg-orange-50/60 sm:px-4">
            <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[9px] font-bold uppercase tracking-wider text-orange-500">
                    {label}
                </p>

                <CopyButton value={value} />
            </div>

            <p
                className="mt-1 truncate text-xs font-bold text-slate-700"
                title={displayValue}
            >
                {displayValue}
            </p>
        </div>
    );
};

/* =========================================================
   VIEW MODAL
========================================================= */

const ViewModal = ({
    vehicle,
    isOpen,
    onClose,
    onEdit,
}: ViewModalProps) => {
    const [isQuickStatsExpanded, setIsQuickStatsExpanded] =
        React.useState(false);

    if (!isOpen || !vehicle) {
        return null;
    }

    // Normalize API vehicle data so flat document fields are available
    // under vehicle.documents as expected by Vehicle_new.
    const normalizedVehicle = normalizeVehicle(vehicle);

    return (
        <div
            className="
                fixed
                inset-0
                z-[9999]
                flex
                items-center
                justify-center
                bg-slate-950/70
                p-2
                backdrop-blur-sm
                sm:p-5
            "
            onClick={onClose}
        >
            {/* =================================================
                MAIN MODAL
            ================================================= */}

            <div
                className="
                    relative
                    flex
                    h-[96vh]
                    w-full
                    max-w-[1200px]
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    border
                    border-orange-200
                    bg-slate-100
                    shadow-[0_30px_100px_rgba(0,0,0,0.35)]
                "
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                {/* =================================================
                    HEADER
                ================================================= */}

                <header
                    className="
                        relative
                        shrink-0
                        overflow-hidden
                        bg-gradient-to-br
                        from-orange-500
                        via-orange-400
                        to-amber-300
                        px-5
                        py-4
                        text-white
                        sm:px-7
                    "
                >
                    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-yellow-300/25 blur-3xl" />

                    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-orange-900/20 blur-3xl" />

                    <div className="relative flex items-center justify-between gap-4">
                        {/* LEFT SIDE */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="rounded-md bg-white px-2.5 py-1 text-[9px] font-black tracking-widest text-orange-600 shadow-sm">
                                    VEHICLE
                                </span>

                                <span className="text-[10px] font-medium uppercase tracking-widest text-orange-100">
                                    Details
                                </span>
                            </div>

                            <h2 className="mt-1.5 truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
                                {normalizedVehicle.vehicleNo}
                            </h2>
                        </div>

                        {/* RIGHT SIDE */}
                        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                            {/* STATUS */}
                            <div className="hidden sm:block">
                                <StatusBadge
                                    status={normalizedVehicle.status}
                                />
                            </div>

                            {/* EDIT VEHICLE */}
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={onEdit}
                                    className="
                                        inline-flex
                                        h-9
                                        items-center
                                        gap-2
                                        rounded-xl
                                        border
                                        border-white/30
                                        bg-white
                                        px-3.5
                                        text-xs
                                        font-bold
                                        text-orange-600
                                        shadow-sm
                                        transition-all
                                        duration-200
                                        hover:bg-orange-50
                                        hover:text-orange-700
                                        hover:shadow-lg
                                        active:scale-95
                                        sm:px-4
                                    "
                                    title="Edit Vehicle"
                                >
                                    {/* EDIT ICON */}
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="h-4 w-4"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 20h9"
                                        />

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M16.5 3.5a2.121 2.121 0 013 3L8 18l-4 1 1-4L16.5 3.5z"
                                        />
                                    </svg>

                                    <span className="hidden sm:inline">
                                        Edit Vehicle
                                    </span>
                                </button>
                            )}

                            {/* CLOSE */}
                            <button
                                type="button"
                                onClick={onClose}
                                className="
                                    flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-xl
                                    border
                                    border-white/20
                                    bg-white/10
                                    text-xl
                                    text-white
                                    backdrop-blur-sm
                                    transition-all
                                    duration-200
                                    hover:border-white/40
                                    hover:bg-white
                                    hover:text-orange-600
                                    hover:shadow-lg
                                    active:scale-95
                                "
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* MOBILE STATUS */}
                    <div className="relative mt-3 sm:hidden">
                        <StatusBadge status={normalizedVehicle.status} />
                    </div>

                    <div className="absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r from-yellow-300 via-white/70 to-orange-900/30" />
                </header>

                {/* =================================================
                    QUICK STATS
                ================================================= */}

                <div className="shrink-0 border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50 px-4 py-3 sm:px-7">
                    <button
                        type="button"
                        onClick={() =>
                            setIsQuickStatsExpanded(
                                (prev) => !prev,
                            )
                        }
                        aria-expanded={
                            isQuickStatsExpanded
                        }
                        className="
                            flex
                            w-full
                            items-center
                            justify-between
                            gap-3
                            rounded-xl
                            border
                            border-orange-200
                            bg-white
                            px-4
                            py-2.5
                            text-left
                            shadow-sm
                            transition-all
                            duration-200
                            hover:border-orange-300
                            hover:bg-orange-50/60
                        "
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-600 to-amber-500 text-white shadow-sm">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="h-4 w-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                                    Quick Details
                                </p>

                                <p className="truncate text-[11px] font-medium text-slate-400">
                                    {isQuickStatsExpanded
                                        ? "Hide vehicle details"
                                        : "Show vehicle details"}
                                </p>
                            </div>
                        </div>

                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                            <svg
                                viewBox="0 0 20 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className={`h-4 w-4 transition-transform duration-300 ${isQuickStatsExpanded
                                    ? "rotate-180"
                                    : ""
                                    }`}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m5 7.5 5 5 5-5"
                                />
                            </svg>
                        </span>
                    </button>

                    <div
                        className={`grid overflow-hidden transition-all duration-300 ease-in-out ${isQuickStatsExpanded
                            ? "mt-3 grid-rows-[1fr] opacity-100"
                            : "mt-0 grid-rows-[0fr] opacity-0"
                            }`}
                    >
                        <div className="min-h-0">
                            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-orange-200 bg-white/80 shadow-sm sm:grid-cols-4">
                                <div className="border-b border-r border-orange-200">
                                    <QuickStat
                                        label="Vehicle No"
                                        value={
                                            normalizedVehicle.vehicleNo
                                        }
                                    />
                                </div>

                                <div className="border-b border-orange-200 sm:border-r">
                                    <QuickStat
                                        label="ETP No"
                                        value={
                                            normalizedVehicle.etpNo
                                        }
                                    />
                                </div>

                                <div className="border-b border-r border-orange-200">
                                    <QuickStat
                                        label="Buyer"
                                        value={
                                            normalizedVehicle.buyerDetails
                                        }
                                    />
                                </div>

                                <div className="border-b border-orange-200">
                                    <QuickStat
                                        label="Transporter"
                                        value={
                                            normalizedVehicle.transporterName
                                        }
                                    />
                                </div>

                                <div className="border-b border-r border-orange-200">
                                    <QuickStat
                                        label="Driver Contact No"
                                        value={
                                            normalizedVehicle.driverContact
                                        }
                                    />
                                </div>

                                <div className="border-b border-orange-200 sm:border-r">
                                    <QuickStat
                                        label="ETP Date"
                                        value={
                                            normalizedVehicle.etpNo
                                        }
                                    />
                                </div>

                                <div className="border-b border-r border-orange-200">
                                    <QuickStat
                                        label="Destination"
                                        value={
                                            normalizedVehicle.destination
                                        }
                                    />
                                </div>

                                <div className="border-b border-orange-200">
                                    <QuickStat
                                        label="Weight"
                                        value={
                                            normalizedVehicle.netWeight !==
                                                undefined
                                                ? `${normalizedVehicle.netWeight} MT`
                                                : "-"
                                        }
                                    />
                                </div>

                                {/* ROUTE */}
                                <div className="col-span-2 border-orange-200 sm:col-span-4">
                                    <QuickStat
                                        label="Route"
                                        value={
                                            normalizedVehicle.route
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =================================================
                    BODY
                ================================================= */}

                <main
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                        bg-gradient-to-b
                        from-orange-50/30
                        via-slate-100
                        to-slate-100
                        px-4
                        py-6
                        sm:px-7
                    "
                >
                    <div className="mx-auto max-w-[1100px] space-y-8">

                        {/* =================================================
                            VEHICLE
                        ================================================= */}

                        <Section
                            number="01"
                            title="Vehicle Information"
                        >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <VehicleDetailItem
                                    label="S.No."
                                    value={normalizedVehicle.sno}
                                />

                                <VehicleDetailItem
                                    label="Vehicle Number"
                                    value={
                                        normalizedVehicle.vehicleNo
                                    }
                                />

                                <VehicleDetailItem
                                    label="Token Number"
                                    value={
                                        normalizedVehicle.tokenNo
                                    }
                                />

                                <VehicleDetailItem
                                    label="Driver Name"
                                    value={
                                        normalizedVehicle.driverName
                                    }
                                />

                                <VehicleDetailItem
                                    label="Driver Contact"
                                    value={
                                        normalizedVehicle.driverContact
                                    }
                                />

                                <VehicleDetailItem
                                    label="Transporter"
                                    value={
                                        normalizedVehicle.transporterName
                                    }
                                />
                            </div>
                        </Section>

                        {/* =================================================
                            MATERIAL
                        ================================================= */}

                        <Section
                            number="02"
                            title="Material & Dispatch"
                        >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <VehicleDetailItem
                                    label="Buyer"
                                    value={
                                        normalizedVehicle.buyerDetails
                                    }
                                />

                                <VehicleDetailItem
                                    label="Material"
                                    value={
                                        normalizedVehicle.materialName
                                    }
                                />

                                <VehicleDetailItem
                                    label="Grade"
                                    value={
                                        normalizedVehicle.materialGrade
                                    }
                                />

                                <VehicleDetailItem
                                    label="Net Weight"
                                    value={
                                        normalizedVehicle.netWeight !==
                                            undefined
                                            ? `${normalizedVehicle.netWeight} MT`
                                            : undefined
                                    }
                                />

                                <VehicleDetailItem
                                    label="Destination"
                                    value={
                                        normalizedVehicle.destination
                                    }
                                />

                                <VehicleDetailItem
                                    label="Route"
                                    value={
                                        normalizedVehicle.route
                                    }
                                />
                            </div>
                        </Section>

                        {/* =================================================
                            MOVEMENT
                        ================================================= */}

                        <Section
                            number="03"
                            title="Movement & Timing"
                        >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <VehicleDetailItem
                                    label="Tyre"
                                    value={
                                        normalizedVehicle.tyre
                                    }
                                />

                                <VehicleDetailItem
                                    label="In Time"
                                    value={
                                        normalizedVehicle.inTime
                                    }
                                />

                                <VehicleDetailItem
                                    label="Out Time"
                                    value={
                                        normalizedVehicle.outTime
                                    }
                                />

                                <VehicleDetailItem
                                    label="Created At"
                                    value={
                                        normalizedVehicle.createdAt
                                    }
                                />

                                <VehicleDetailItem
                                    label="Updated At"
                                    value={
                                        normalizedVehicle.updatedAt
                                    }
                                />

                                <VehicleDetailItem
                                    label="Current Status"
                                    value={
                                        normalizedVehicle.status
                                    }
                                />
                            </div>
                        </Section>

                        {/* =================================================
                            DOCUMENTS
                        ================================================= */}

                        <Section
                            number="04"
                            title="Documents"
                        >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <CommonFileUpload
                                    label="Vehicle Image"
                                    value={
                                        normalizedVehicle.documents
                                            ?.vehicleImage ||
                                        null
                                    }
                                    onChange={() => { }}
                                    maxSizeMB={100}
                                    disabled={
                                        true
                                    }

                                />

                                <CommonFileUpload
                                    label="Vehicle Registration"
                                    value={
                                        normalizedVehicle.documents
                                            ?.vehicleRegistrationImage ||
                                        null
                                    }
                                    onChange={() => { }}
                                    maxSizeMB={100}
                                    disabled={
                                        true
                                    }
                                />

                                <CommonFileUpload
                                    label="Weight Slip"
                                    value={
                                        normalizedVehicle.documents
                                            ?.weightSlip ||
                                        null
                                    }
                                    onChange={() => { }}
                                    maxSizeMB={100} disabled={
                                        true
                                    }
                                />

                                <CommonFileUpload
                                    label="ETP"
                                    value={
                                        normalizedVehicle.documents
                                            ?.etp || null
                                    }
                                    onChange={() => { }}
                                    maxSizeMB={100} disabled={
                                        true
                                    }
                                />

                                <CommonFileUpload
                                    label="Invoice"
                                    value={
                                        normalizedVehicle.documents
                                            ?.invoiceImage ||
                                        null
                                    }
                                    onChange={() => { }}
                                    maxSizeMB={100} disabled={
                                        true
                                    }
                                />

                                <CommonFileUpload
                                    label="E-Way Bill"
                                    value={
                                        normalizedVehicle.documents
                                            ?.EWayBill ||
                                        null
                                    }
                                    onChange={() => { }}
                                    maxSizeMB={100} disabled={
                                        true
                                    }
                                />

                                <CommonFileUpload
                                    label="LR Slip"
                                    value={
                                        normalizedVehicle.documents
                                            ?.LRSlip ||
                                        null
                                    }
                                    onChange={() => { }}
                                    maxSizeMB={100} disabled={
                                        true
                                    }
                                />

                                <CommonFileUpload
                                    label="Driver License"
                                    value={
                                        normalizedVehicle.documents
                                            ?.driverLicenseImage ||
                                        null
                                    }
                                    onChange={() => { }}
                                    maxSizeMB={100} disabled={
                                        true
                                    }
                                />
                                <CommonFileUpload
                                    label="Loading Video"
                                    value={
                                        normalizedVehicle.documents
                                            ?.loadingVideo ||
                                        null
                                    }
                                    onChange={() => { }}
                                    maxSizeMB={100} disabled={
                                        true
                                    }
                                />
                            </div>
                        </Section>

                        {/* =================================================
                            LOCATION
                        ================================================= */}

                        <Section
                            number="05"
                            title="Current Location"
                        >
                            {normalizedVehicle.currentLocation ? (
                                <div
                                    className="
                                        overflow-hidden
                                        rounded-2xl
                                        border
                                        border-orange-200
                                        bg-white
                                        shadow-sm
                                    "
                                >
                                    <div
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            bg-gradient-to-r
                                            from-orange-700
                                            via-orange-600
                                            to-amber-500
                                            px-4
                                            py-3
                                            text-white
                                        "
                                    >
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-orange-100">
                                                Live Location
                                            </p>

                                            <p className="mt-1 text-xs font-semibold">
                                                {vehicle?.currentLocation?.address ||
                                                    "Coordinates available"}
                                            </p>
                                        </div>

                                        <span
                                            className="
                                                h-2.5
                                                w-2.5
                                                animate-pulse
                                                rounded-full
                                                bg-green-300
                                                ring-4
                                                ring-green-300/20
                                            "
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <VehicleDetailItem
                                            label="Latitude"
                                            value={
                                                vehicle?.currentLocation?.latitude
                                            }
                                        />

                                        <VehicleDetailItem
                                            label="Longitude"
                                            value={
                                                vehicle?.currentLocation?.longitude
                                            }
                                        />

                                        <VehicleDetailItem
                                            label="Address"
                                            value={
                                                vehicle?.currentLocation?.address
                                            }
                                        />

                                        <VehicleDetailItem
                                            label="Accuracy"
                                            value={
                                                vehicle?.currentLocation?.accuracy
                                            }
                                        />

                                        <VehicleDetailItem
                                            label="Speed"
                                            value={
                                                vehicle?.currentLocation?.speed
                                            }
                                        />

                                        <VehicleDetailItem
                                            label="Heading"
                                            value={
                                                vehicle?.currentLocation?.heading
                                            }
                                        />

                                        <VehicleDetailItem
                                            label="Recorded At"
                                            value={
                                                vehicle?.currentLocation?.recordedAt
                                            }
                                        />
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    text="Current location is not available"
                                />
                            )}
                        </Section>

                        {/* =================================================
                            USERS
                        ================================================= */}

                        <Section
                            number="06"
                            title="User Information"
                        >
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                                {/* CREATED BY */}
                                <div
                                    className="
                                        rounded-2xl
                                        border
                                        border-orange-100
                                        bg-white
                                        p-4
                                        shadow-sm
                                    "
                                >
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-orange-500">
                                        Created By
                                    </p>

                                    {normalizedVehicle.createdBy ? (
                                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                            <VehicleDetailItem
                                                label="Name"
                                                value={
                                                    vehicle?.createdBy?.name
                                                }
                                            />

                                            <VehicleDetailItem
                                                label="Role"
                                                value={
                                                    vehicle?.createdBy?.role
                                                }
                                            />

                                            <VehicleDetailItem
                                                label="Email"
                                                value={
                                                    vehicle?.createdBy?.email
                                                }
                                            />

                                            <VehicleDetailItem
                                                label="User ID"
                                                value={
                                                    vehicle?.createdBy?.id
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <EmptyState
                                            text="Created by information not available"
                                        />
                                    )}
                                </div>

                                {/* UPDATED BY */}
                                <div
                                    className="
                                        rounded-2xl
                                        border
                                        border-orange-100
                                        bg-white
                                        p-4
                                        shadow-sm
                                    "
                                >
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-orange-500">
                                        Updated By
                                    </p>

                                    {normalizedVehicle.updatedBy ? (
                                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                            <VehicleDetailItem
                                                label="Name"
                                                value={
                                                    vehicle?.updatedBy?.name
                                                }
                                            />

                                            <VehicleDetailItem
                                                label="Role"
                                                value={
                                                    vehicle?.updatedBy?.role
                                                }
                                            />

                                            <VehicleDetailItem
                                                label="Email"
                                                value={
                                                    vehicle?.updatedBy?.email
                                                }
                                            />

                                            <VehicleDetailItem
                                                label="User ID"
                                                value={
                                                    vehicle?.updatedBy?.id
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <EmptyState
                                            text="Updated by information not available"
                                        />
                                    )}
                                </div>
                            </div>
                        </Section>

                        {/* =================================================
                            TRACKING
                        ================================================= */}

                        <Section
                            number="07"
                            title="Activity Timeline"
                        >
                            {normalizedVehicle.tracking &&
                                normalizedVehicle.tracking.length > 0 ? (
                                <div className="relative">

                                    {/* TIMELINE LINE */}
                                    <div
                                        className="
                                            absolute
                                            bottom-5
                                            left-[15px]
                                            top-5
                                            w-px
                                            bg-gradient-to-b
                                            from-orange-400
                                            via-orange-200
                                            to-slate-200
                                        "
                                    />

                                    <div className="space-y-5">
                                        {normalizedVehicle.tracking
                                            .slice()
                                            .reverse()
                                            .map(
                                                (
                                                    item,
                                                    index,
                                                ) => (
                                                    <div
                                                        key={`${item.createdAt}-${index}`}
                                                        className="relative pl-10"
                                                    >
                                                        {/* DOT */}
                                                        <div
                                                            className="
                                                                absolute
                                                                left-[8px]
                                                                top-4
                                                                z-10
                                                                h-4
                                                                w-4
                                                                rounded-full
                                                                border-4
                                                                border-orange-50
                                                                bg-orange-500
                                                                shadow-sm
                                                            "
                                                        />

                                                        <div
                                                            className="
                                                                rounded-2xl
                                                                border
                                                                border-orange-100
                                                                bg-white
                                                                p-4
                                                                shadow-sm
                                                            "
                                                        >
                                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                                <div>
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span
                                                                            className="
                                                                                rounded-full
                                                                                bg-gradient-to-r
                                                                                from-orange-100
                                                                                to-amber-50
                                                                                px-3
                                                                                py-1.5
                                                                                text-[10px]
                                                                                font-bold
                                                                                text-orange-700
                                                                            "
                                                                        >
                                                                            {
                                                                                item.action
                                                                            }
                                                                        </span>

                                                                        {item.fromStatus &&
                                                                            item.toStatus ? (
                                                                            <span className="text-[10px] font-medium text-slate-400">
                                                                                {
                                                                                    item.fromStatus
                                                                                }
                                                                                {" → "}
                                                                                {
                                                                                    item.toStatus
                                                                                }
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                </div>

                                                                <span
                                                                    className="
                                                                        shrink-0
                                                                        text-[10px]
                                                                        font-medium
                                                                        text-slate-400
                                                                    "
                                                                >
                                                                    {
                                                                        item.createdAt
                                                                            ? new Date(item.createdAt).toLocaleString("en-IN", {
                                                                                day: "2-digit",
                                                                                month: "2-digit",
                                                                                year: "numeric",
                                                                                hour: "2-digit",
                                                                                minute: "2-digit",
                                                                                hour12: true,
                                                                            })
                                                                            : "-"
                                                                    }
                                                                </span>
                                                            </div>

                                                            {/* USER */}
                                                            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                                                <VehicleDetailItem
                                                                    label="User"
                                                                    value={
                                                                        item
                                                                            .user
                                                                            .name
                                                                    }
                                                                />

                                                                <VehicleDetailItem
                                                                    label="Email"
                                                                    value={
                                                                        item
                                                                            .user
                                                                            .email
                                                                    }
                                                                />

                                                                <VehicleDetailItem
                                                                    label="Role"
                                                                    value={
                                                                        item
                                                                            .user
                                                                            .role
                                                                    }
                                                                />
                                                            </div>

                                                            {/* CHANGES */}
                                                            {item.changes &&
                                                                item.changes.length >
                                                                0 ? (
                                                                <div className="mt-4 border-t border-orange-100 pt-4">
                                                                    <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-orange-500">
                                                                        Field
                                                                        Changes
                                                                    </p>

                                                                    <div className="space-y-2">
                                                                        {item.changes.map(
                                                                            (
                                                                                change,
                                                                                changeIndex,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        changeIndex
                                                                                    }
                                                                                    className="
                                                                                        rounded-xl
                                                                                        border
                                                                                        border-slate-200
                                                                                        bg-slate-50
                                                                                        p-3
                                                                                    "
                                                                                >
                                                                                    <p className="mb-2 text-xs font-bold text-slate-700">
                                                                                        {
                                                                                            change.field
                                                                                        }
                                                                                    </p>

                                                                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                                                        <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                                                                                            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-red-400">
                                                                                                Previous
                                                                                            </p>

                                                                                            <pre className="whitespace-pre-wrap break-all font-sans text-xs text-slate-600">
                                                                                                {formatTrackingValue(
                                                                                                    change.oldValue,
                                                                                                )}
                                                                                            </pre>
                                                                                        </div>

                                                                                        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                                                                                            <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-emerald-500">
                                                                                                Updated
                                                                                            </p>

                                                                                            <pre className="whitespace-pre-wrap break-all font-sans text-xs text-slate-600">
                                                                                                {formatTrackingValue(
                                                                                                    change.newValue,
                                                                                                )}
                                                                                            </pre>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : null}

                                                            {/* LOCATION */}
                                                            {item.location ? (
                                                                <div className="mt-4 border-t border-orange-100 pt-4">
                                                                    <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-orange-500">
                                                                        Activity
                                                                        Location
                                                                    </p>

                                                                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                                                        <VehicleDetailItem
                                                                            label="Latitude"
                                                                            value={
                                                                                item
                                                                                    .location
                                                                                    .latitude
                                                                            }
                                                                        />

                                                                        <VehicleDetailItem
                                                                            label="Longitude"
                                                                            value={
                                                                                item
                                                                                    .location
                                                                                    .longitude
                                                                            }
                                                                        />

                                                                        <VehicleDetailItem
                                                                            label="Address"
                                                                            value={
                                                                                item
                                                                                    .location
                                                                                    .address
                                                                            }
                                                                        />

                                                                        <VehicleDetailItem
                                                                            label="Speed"
                                                                            value={
                                                                                item
                                                                                    .location
                                                                                    .speed
                                                                            }
                                                                        />

                                                                        <VehicleDetailItem
                                                                            label="Heading"
                                                                            value={
                                                                                item
                                                                                    .location
                                                                                    .heading
                                                                            }
                                                                        />

                                                                        <VehicleDetailItem
                                                                            label="Accuracy"
                                                                            value={
                                                                                item
                                                                                    .location
                                                                                    .accuracy
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ) : null}

                                                            {/* COMMENT */}
                                                            {item.comment ? (
                                                                <div
                                                                    className="
                                                                        mt-4
                                                                        rounded-xl
                                                                        border
                                                                        border-orange-200
                                                                        bg-gradient-to-r
                                                                        from-orange-50
                                                                        to-amber-50
                                                                        p-3
                                                                    "
                                                                >
                                                                    <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-orange-600">
                                                                        Comment
                                                                    </p>

                                                                    <p className="text-xs leading-5 text-slate-700">
                                                                        {
                                                                            item.comment
                                                                        }
                                                                    </p>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    text="No activity history available"
                                />
                            )}
                        </Section>
                    </div>
                </main>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer
                    className="
                        flex
                        shrink-0
                        items-center
                        justify-between
                        border-t
                        border-orange-100
                        bg-gradient-to-r
                        from-white
                        to-orange-50
                        px-5
                        py-3
                        sm:px-7
                    "
                >
                    <div className="hidden sm:block">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-orange-500">
                            Vehicle ID
                        </p>

                        <p
                            className="
                                mt-0.5
                                max-w-[350px]
                                truncate
                                text-[10px]
                                text-slate-500
                            "
                        >
                            {normalizedVehicle._id || "-"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            ml-auto
                            rounded-xl
                            bg-gradient-to-r
                            from-orange-600
                            to-amber-500
                            px-6
                            py-2.5
                            text-xs
                            font-bold
                            text-white
                            shadow-md
                            shadow-orange-200
                            transition-all
                            duration-200
                            hover:from-orange-700
                            hover:to-amber-600
                            hover:shadow-lg
                            active:scale-[0.98]
                        "
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ViewModal;