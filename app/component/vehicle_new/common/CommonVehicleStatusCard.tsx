"use client";

import { Vehicle } from "@/app/types/vehicle";
import { Check, CirclePause, Copy, MessageSquare, Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import CommonButton from "./CommonButton";
import { StatusBadge } from "./vehicleStatus";
import { formatDateTime } from "./dateTime";
import { getLastStatusChange } from "@/app/utils/lastStatusChange";

export interface CommonVehicleStatusCardProps {
    tokenNo?: string;
    vehicleNo?: string;
    status: string;
    vehicle: Vehicle;

    onClick?: () => void;
    onEdit?: () => void;

    showEdit?: boolean;
    showGoogleChat?: boolean;
}

/** "just now", "12m ago", "3h ago", "2d ago"; "" when unparseable (legacy DD-MM-YYYY strings are shown via the tooltip instead). */
const formatRelative = (value?: string | null): string => {
    if (!value) return "";

    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return "";

    const minutes = Math.floor((Date.now() - time) / 60000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / (60 * 24))}d ago`;
};

const CommonVehicleStatusCard = ({
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

    const statusChange = getLastStatusChange(vehicle);
    const statusChangedAt = formatDateTime(statusChange?.at);
    const statusChangedAgo = formatRelative(statusChange?.at);

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLDivElement>,
    ) => {
        if (
            onClick &&
            e.target === e.currentTarget &&
            (e.key === "Enter" || e.key === " ")
        ) {
            e.preventDefault();
            onClick();
        }
    };

    const hasActions = (showEdit && onEdit) || showGoogleChat;

    const holdReason =
        String(status ?? "").toUpperCase() === "ON_HOLD"
            ? vehicle.holdReason?.trim()
            : undefined;

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
            onKeyDown={handleKeyDown}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={
                onClick
                    ? `Open vehicle ${vehicleNo || tokenNo || ""}`
                    : undefined
            }
            className={`
                group
                flex
                flex-col
                gap-3
                rounded-xl
                border
                border-gray-200
                bg-white
                p-4
                transition
                duration-200
                ${onClick
                    ? "cursor-pointer hover:border-orange-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                    : ""}
            `}
        >
            {/* ================= HEADER ================= */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-1.5">
                    <p className="truncate text-base font-semibold tracking-wider text-gray-900">
                        {vehicleNo || "-"}
                    </p>

                    {vehicleNo && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                copyVehicleNo();
                            }}
                            title="Copy vehicle number"
                            aria-label={
                                copied
                                    ? "Copied"
                                    : "Copy vehicle number"
                            }
                            className={`inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${copied
                                ? "text-green-600"
                                : "text-gray-300 hover:bg-gray-100 hover:text-gray-600 group-hover:text-gray-400"}`}
                        >
                            {copied ? (
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                        </button>
                    )}
                </div>

                <StatusBadge status={status} />
            </div>

            {/* ================= META ================= */}
            <dl className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
                <div className="min-w-0">
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                        Token
                    </dt>
                    <dd className="mt-0.5 truncate text-sm font-medium tabular-nums text-gray-800">
                        {tokenNo || "-"}
                    </dd>
                </div>

                {statusChange && (
                    <div
                        className="min-w-0"
                        title={statusChangedAt ? `Status changed on ${statusChangedAt}` : undefined}
                    >
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                            Updated by
                        </dt>
                        <dd className="mt-0.5 flex min-w-0 items-baseline gap-1.5 text-sm">
                            <span className="truncate font-medium text-gray-800">
                                {statusChange.user.name}
                            </span>
                            {statusChangedAgo && (
                                <span className="shrink-0 text-xs text-gray-400">
                                    · {statusChangedAgo}
                                </span>
                            )}
                        </dd>
                    </div>
                )}
            </dl>

            {/* ================= HOLD REASON ================= */}
            {holdReason && (
                <p
                    className="flex items-start gap-1.5 rounded-md bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700"
                    title={holdReason}
                >
                    <CirclePause
                        className="mt-px h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                    />
                    <span className="line-clamp-2 min-w-0 break-words">
                        <span className="font-medium">Reason:</span>{" "}
                        {holdReason}
                    </span>
                </p>
            )}

            {/* ================= ACTIONS ================= */}
            {hasActions && (
                <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                    {showEdit && onEdit && (
                        <CommonButton
                            variant="secondary"
                            size="sm"
                            icon={Pencil}
                            onClick={handleEdit}
                        >
                            Edit
                        </CommonButton>
                    )}

                    {showGoogleChat && (
                        <CommonButton
                            variant="success"
                            size="sm"
                            icon={MessageSquare}
                            onClick={sendToGoogleChat}
                            loading={sendingChat}
                            loadingText="Sending..."
                            className="ml-auto"
                        >
                            Send to Google Chat
                        </CommonButton>
                    )}
                </div>
            )}
        </div>
    );
};

export default CommonVehicleStatusCard;
