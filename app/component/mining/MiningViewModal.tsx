"use client";

import React from "react";
import {
    Activity,
    CalendarClock,
    MapPin,
    Paperclip,
    Pencil,
    Scale,
    Truck,
} from "lucide-react";

import {
    miningReasonLabel,
    needsMiningReason,
    type MiningFieldUpdate,
    type MiningObject,
} from "@/app/types/mining";

import CommonButton from "../vehicle_new/common/CommonButton";
import CommonFileUpload from "../vehicle_new/common/CommonFileUpload";
import CommonModal from "../vehicle_new/common/CommonModal";
import {
    DetailGrid,
    DetailItem,
    EmptyNote,
    ModalSection,
    isEmptyValue,
} from "../vehicle_new/common/ModalParts";
import { MiningStatusBadge } from "./miningStatus";
import { formatMiningDate, formatWeight } from "./MiningColumns";

interface MiningViewModalProps {
    trip: MiningObject | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
}

/* =========================================================
   HELPERS
========================================================= */

/** "loadedWeight" -> "Loaded weight" */
const formatField = (field: string) => {
    const spaced = field
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replaceAll("_", " ")
        .toLowerCase();

    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const formatValue = (field: string, value: unknown): string => {
    if (isEmptyValue(value)) {
        return "—";
    }

    // URLs are long; the count says enough in the history
    if (field === "files" && Array.isArray(value)) {
        return `${value.length} file${value.length === 1 ? "" : "s"}`;
    }

    if (field === "weightSlip") {
        return "Uploaded";
    }

    if (field.endsWith("At")) {
        return formatMiningDate(value as string) || String(value);
    }

    if (field.endsWith("Weight") && typeof value === "number") {
        return formatWeight(value);
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
};

/** "2h 15m" between two times, or "" if either is missing. */
const formatDuration = (from?: Date | string, to?: Date | string): string => {
    if (!from || !to) return "";

    const minutes = Math.round(
        (new Date(to).getTime() - new Date(from).getTime()) / 60_000,
    );

    if (!Number.isFinite(minutes) || minutes < 0) return "";

    const hours = Math.floor(minutes / 60);

    return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

/* =========================================================
   HISTORY ENTRY
========================================================= */

const HistoryEntry = ({
    item,
    isLast,
}: {
    item: MiningFieldUpdate;
    isLast: boolean;
}) => (
    <li className="relative min-w-0 pb-5 pl-7 last:pb-0 sm:pl-8">
        {!isLast && (
            <span
                className="absolute left-[7px] top-4 h-full w-px bg-gray-200"
                aria-hidden="true"
            />
        )}

        <span
            className="absolute left-0 top-1 h-[15px] w-[15px] rounded-full border-[3px] border-white bg-orange-400 ring-1 ring-gray-200"
            aria-hidden="true"
        />

        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-sm font-medium text-gray-900">
                {formatField(item.field)}
            </p>
            <time className="text-xs tabular-nums text-gray-500">
                {formatMiningDate(item.updatedAt) || "—"}
            </time>
        </div>

        {item.updatedBy && (
            <p className="mt-0.5 text-xs text-gray-500">
                by{" "}
                <span className="font-medium text-gray-700">
                    {item.updatedBy}
                </span>
            </p>
        )}

        {item.field === "status" ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {!isEmptyValue(item.oldValue) && (
                    <>
                        <MiningStatusBadge status={String(item.oldValue)} />
                        <span className="text-gray-400" aria-hidden="true">→</span>
                    </>
                )}
                <MiningStatusBadge status={String(item.newValue ?? "")} />
            </div>
        ) : (
            <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                <span className="break-all text-gray-400 line-through">
                    {formatValue(item.field, item.oldValue)}
                </span>
                <span className="text-gray-400" aria-hidden="true">→</span>
                <span className="break-all text-gray-900">
                    {formatValue(item.field, item.newValue)}
                </span>
            </p>
        )}
    </li>
);

/* =========================================================
   VIEW MODAL
========================================================= */

const MiningViewModal = ({
    trip,
    isOpen,
    onClose,
    onEdit,
}: MiningViewModalProps) => {
    if (!isOpen || !trip) {
        return null;
    }

    const history = (trip.updateHistory ?? []).slice().reverse();
    const files = trip.files ?? [];

    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            title={
                <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span className="truncate tracking-wide">
                        {trip.vehicleNo || "Mining trip"}
                    </span>
                    <span className="shrink-0">
                        <MiningStatusBadge status={trip.status} />
                    </span>
                </span>
            }
            description={
                trip.createdAt && `Created ${formatMiningDate(trip.createdAt)}`
            }
            footer={
                <div className="flex gap-2 sm:justify-end">
                    <CommonButton
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1 sm:flex-none"
                    >
                        Close
                    </CommonButton>

                    {onEdit && (
                        <CommonButton
                            icon={Pencil}
                            onClick={onEdit}
                            className="flex-1 sm:flex-none"
                        >
                            Edit trip
                        </CommonButton>
                    )}
                </div>
            }
        >
            <div className="space-y-3 bg-gray-50 p-3 sm:space-y-4 sm:p-6">
                <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
                    {/* ================= MAIN COLUMN ================= */}

                    <div className="min-w-0 space-y-3 sm:space-y-4 lg:col-span-2">
                        <ModalSection title="Trip details" icon={Truck}>
                            <DetailGrid columns={3}>
                                <DetailItem label="Vehicle no" value={trip.vehicleNo} mono />
                                <DetailItem label="Type of mining" value={trip.miningType} />
                                <DetailItem label="Lot" value={trip.lot} mono />
                                <DetailItem label="Size" value={trip.size} />
                                {needsMiningReason(trip.status) && (
                                    <DetailItem
                                        label={miningReasonLabel(trip.status)}
                                        value={trip.cancelReason}
                                        wide
                                    />
                                )}
                            </DetailGrid>
                        </ModalSection>

                        <ModalSection title="Weights" icon={Scale}>
                            <DetailGrid columns={3}>
                                <DetailItem label="Empty weight" value={formatWeight(trip.emptyWeight)} />
                                <DetailItem label="Loaded weight" value={formatWeight(trip.loadedWeight)} />
                                <DetailItem label="Actual weight" value={formatWeight(trip.actualWeight)} />
                            </DetailGrid>

                            <div className="mt-4">
                                {trip.weightSlip?.url ? (
                                    <>
                                        <CommonFileUpload
                                            label="Weight slip"
                                            value={trip.weightSlip.url}
                                            disabled
                                            onChange={() => { }}
                                            className="w-full"
                                        />
                                        {(trip.weightSlip.uploadedBy || trip.weightSlip.uploadedAt) && (
                                            <p className="mt-1.5 text-xs text-gray-500">
                                                Uploaded
                                                {trip.weightSlip.uploadedBy && <> by <span className="font-medium text-gray-700">{trip.weightSlip.uploadedBy}</span></>}
                                                {trip.weightSlip.uploadedAt && <> on {formatMiningDate(trip.weightSlip.uploadedAt)}</>}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <EmptyNote>No weight slip uploaded</EmptyNote>
                                )}
                            </div>
                        </ModalSection>

                        <ModalSection title="Loading & unloading" icon={MapPin}>
                            <DetailGrid columns={3}>
                                <DetailItem label="Loading point" value={trip.loadingPoint} />
                                <DetailItem label="Loading person" value={trip.loadingPerson} />
                                <DetailItem label="Loaded at" value={formatMiningDate(trip.loadedAt)} />
                                <DetailItem label="Unloading point" value={trip.unloadingPoint} />
                                <DetailItem label="Unloading person" value={trip.unloadingPerson} />
                                <DetailItem label="Unloaded at" value={formatMiningDate(trip.unloadedAt)} />
                            </DetailGrid>
                        </ModalSection>

                        <ModalSection
                            title="Files"
                            icon={Paperclip}
                            action={
                                <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-600">
                                    {files.length} file{files.length === 1 ? "" : "s"}
                                </span>
                            }
                        >
                            {files.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {files.map((file, index) => (
                                        <div key={file.url} className="min-w-0">
                                            <CommonFileUpload
                                                label={`File ${index + 1}`}
                                                value={file.url}
                                                disabled
                                                onChange={() => { }}
                                                className="w-full"
                                            />
                                            {(file.uploadedBy || file.uploadedAt) && (
                                                <p className="mt-1.5 text-xs text-gray-500">
                                                    Uploaded
                                                    {file.uploadedBy && <> by <span className="font-medium text-gray-700">{file.uploadedBy}</span></>}
                                                    {file.uploadedAt && <> on {formatMiningDate(file.uploadedAt)}</>}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyNote>No files uploaded</EmptyNote>
                            )}
                        </ModalSection>
                    </div>

                    {/* ================= SIDE COLUMN ================= */}

                    <div className="grid min-w-0 grid-cols-1 content-start items-start gap-3 sm:gap-4">
                        <ModalSection title="Tracking" icon={CalendarClock}>
                            <dl className="space-y-3">
                                <DetailItem label="Trip ID" value={trip.id} mono />
                                <DetailItem label="Created" value={formatMiningDate(trip.createdAt)} />
                                <DetailItem label="Created by" value={trip.createdBy} />
                                <DetailItem
                                    label="Time in transit"
                                    value={formatDuration(trip.loadedAt, trip.unloadedAt)}
                                />
                                <DetailItem label="Last updated" value={formatMiningDate(trip.updatedAt)} />
                                <DetailItem label="Last updated by" value={trip.updatedBy} />
                            </dl>
                        </ModalSection>
                    </div>
                </div>

                {/* ================= HISTORY ================= */}

                <ModalSection
                    title="Activity"
                    description="Most recent first"
                    icon={Activity}
                    collapsible
                    defaultOpen={false}
                    action={
                        history.length > 0 && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-600">
                                {history.length}
                            </span>
                        )
                    }
                >
                    {history.length > 0 ? (
                        <ol>
                            {history.map((item, index) => (
                                <HistoryEntry
                                    key={`${item.field}-${String(item.updatedAt)}-${index}`}
                                    item={item}
                                    isLast={index === history.length - 1}
                                />
                            ))}
                        </ol>
                    ) : (
                        <EmptyNote>No activity recorded yet</EmptyNote>
                    )}
                </ModalSection>
            </div>
        </CommonModal>
    );
};

export default MiningViewModal;
