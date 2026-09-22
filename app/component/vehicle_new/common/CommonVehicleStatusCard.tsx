"use client";

import { Vehicle } from "@/app/types/vehicle";
import { useState } from "react";
import toast from "react-hot-toast";

export interface CommonVehicleStatusCardProps {
    sno: number;
    tokenNo?: string;
    vehicleNo?: string;
    status: string;
    vehicle: Vehicle;

    onClick?: () => void;
    onEdit?: () => void;

    showEdit?: boolean;
    showGoogleChat?: boolean;
}

const CommonVehicleStatusCard = ({
    sno,
    tokenNo,
    vehicleNo,
    status,
    vehicle,
    onClick,
    onEdit,
    showEdit = true,
    showGoogleChat = true,
}: CommonVehicleStatusCardProps) => {
    const [copied, setCopied] = useState(false);
    const [sendingChat, setSendingChat] = useState(false);

    const statusStyles: Record<string, string> = {
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

    const formatStatus = (value: string) => {
        return value
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    /* ================= COPY ================= */

    const copyVehicleNo = async () => {
        if (!vehicleNo) return;

        try {
            await navigator.clipboard.writeText(vehicleNo);

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 1500);
        } catch (error) {
            console.error("Copy error:", error);
            toast.error("Unable to copy vehicle number");
        }
    };

    /* ================= GOOGLE CHAT ================= */

    const sendToGoogleChat = async (
        e: React.MouseEvent<HTMLButtonElement>,
    ) => {
        e.stopPropagation();

        if (!vehicle.vehicleNo) {
            toast.error("Vehicle number is missing");
            return;
        }

        if (!vehicle.status) {
            toast.error("Vehicle status is missing");
            return;
        }

        try {
            setSendingChat(true);

            const response = await fetch("/api/google-chat/vehicle", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    vehicleNumber: vehicle.vehicleNo,
                    status: vehicle.status,
                    transporter: vehicle.transporterName,
                    driverName: vehicle.driverName,
                    driverMobile: vehicle.driverContact,
                    location: vehicle.destination,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Failed to send Google Chat message",
                );
            }

            toast.success("Vehicle update sent to Google Chat");
        } catch (error) {
            console.error(
                "Google Chat notification error:",
                error,
            );

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to send Google Chat message",
            );
        } finally {
            setSendingChat(false);
        }
    };

    /* ================= EDIT ================= */

    const handleEdit = (
        e: React.MouseEvent<HTMLButtonElement>,
    ) => {
        e.stopPropagation();

        onEdit?.();
    };

    return (
        <div
            onClick={onClick}
            className="
                group
                relative
                cursor-pointer
                overflow-hidden
                rounded-xl
                border
                border-gray-100
                bg-white
                px-4
                py-3
                shadow-md
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:border-orange-200
                hover:shadow-lg
            "
        >
            {/* ================= TOP ACCENT ================= */}

            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-orange-500 to-orange-300" />

            {/* ================= HEADER ================= */}

            <div className="mb-2.5 flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    S.No: {sno}
                </span>

                <span
                    className={`
                        rounded-full
                        px-2.5
                        py-0.5
                        text-[11px]
                        font-semibold
                        ${statusStyles[status] ||
                        "bg-gray-100 text-gray-700"
                        }
                    `}
                >
                    {formatStatus(status)}
                </span>
            </div>

            {/* ================= CONTENT ================= */}

            <div className="space-y-2">

                {/* Token */}

                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                        Token No
                    </p>

                    <p className="text-sm font-bold text-gray-900">
                        {tokenNo || "-"}
                    </p>
                </div>

                {/* Vehicle */}

                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                            Vehicle No
                        </p>

                        <p className="truncate text-base font-bold text-orange-600 transition-transform duration-300 group-hover:scale-[1.02]">
                            {vehicleNo || "-"}
                        </p>
                    </div>

                    {/* Copy */}

                    {vehicleNo && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                copyVehicleNo();
                            }}
                            className="
                                shrink-0
                                cursor-pointer
                                rounded-md
                                px-1.5
                                py-1
                                text-gray-500
                                transition
                                hover:bg-orange-50
                                hover:text-orange-600
                            "
                            title="Copy Vehicle No"
                        >
                            {copied ? (
                                <span className="text-[10px] font-semibold text-green-600">
                                    ✓
                                </span>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.8}
                                    stroke="currentColor"
                                    className="h-4 w-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 8h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z"
                                    />

                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
                                    />
                                </svg>
                            )}
                        </button>
                    )}
                </div>

                {/* ================= ACTIONS ================= */}

                <div className="mt-3 flex items-center justify-between gap-2">

                    {/* Small Edit Button */}

                    {showEdit && onEdit && (
                        <button
                            type="button"
                            onClick={handleEdit}
                            className="
                                inline-flex
                                h-8
                                cursor-pointer
                                items-center
                                gap-1.5
                                rounded-md
                                border
                                border-orange-200
                                bg-orange-50
                                px-2.5
                                text-xs
                                font-semibold
                                text-orange-600
                                transition-all
                                duration-200
                                hover:border-orange-500
                                hover:bg-orange-500
                                hover:text-white
                                active:scale-95
                            "
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="h-3.5 w-3.5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13l-3.685 1.053 1.053-3.685a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487Z"
                                />

                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.5 7.125 16.875 4.5"
                                />
                            </svg>

                            Edit
                        </button>
                    )}

                    {/* Google Chat */}

                    {showGoogleChat && (
                        <button
                            type="button"
                            onClick={sendToGoogleChat}
                            disabled={sendingChat}
                            className="
                                ml-auto
                                inline-flex
                                h-8
                                cursor-pointer
                                items-center
                                gap-1.5
                                rounded-md
                                bg-green-600
                                px-2.5
                                text-xs
                                font-semibold
                                text-white
                                transition-all
                                duration-200
                                hover:bg-green-700
                                active:scale-95
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                            "
                        >
                            {sendingChat ? (
                                <>
                                    <svg
                                        className="h-3.5 w-3.5 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />

                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 0 0 8-8v4a4 4 0 0 0-4 4H4z"
                                        />
                                    </svg>

                                    Sending...
                                </>
                            ) : (
                                <>
                                    <span>💬</span>
                                    Google Chat
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommonVehicleStatusCard;