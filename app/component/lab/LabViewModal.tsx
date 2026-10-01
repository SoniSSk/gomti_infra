"use client";

import React from "react";
import {
    Activity,
    CalendarClock,
    FileText,
    FileX,
    FlaskConical,
    Microscope,
    Pencil,
} from "lucide-react";

import type { LabDocuments, LabFieldUpdate, LabObject } from "@/app/types/lab";

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
import { LabStatusBadge } from "./labStatus";
import { REPORT_FIELDS, formatLabDate, reportFieldLabel } from "./LabColumns";

interface LabViewModalProps {
    lab: LabObject | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
}

/* =========================================================
   HELPERS
========================================================= */

/** "expectedReportAt" -> "Expected report at" */
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

    if (field.endsWith("At")) {
        return formatLabDate(value as string) || String(value);
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
};

export const LAB_DOCUMENTS: {
    key: Exclude<keyof LabDocuments, "otherDocuments">;
    label: string;
}[] = [
    { key: "samplePhoto1", label: "Sample Photo 1" },
    { key: "samplePhoto2", label: "Sample Photo 2" },
    { key: "samplePhoto3", label: "Sample Photo 3" },
    { key: "sampleVideo", label: "Sample Video" },
    { key: "report", label: "Report" },
    { key: "other", label: "Other" },
];

/* =========================================================
   DOCUMENT
========================================================= */

const DocumentItem = ({
    label,
    value,
}: {
    label: string;
    value?: string | null;
}) => {
    if (!value) {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 px-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                    <FileX className="h-4 w-4" aria-hidden="true" />
                </span>

                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-700">
                        {label}
                    </p>
                    <p className="text-xs text-gray-400">Not uploaded</p>
                </div>
            </div>
        );
    }

    return (
        <CommonFileUpload
            label={label}
            value={value}
            disabled
            onChange={() => { }}
            maxSizeMB={100}
            className="w-full"
        />
    );
};

/* =========================================================
   HISTORY ENTRY
========================================================= */

const HistoryEntry = ({
    item,
    isLast,
}: {
    item: LabFieldUpdate;
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
                {formatLabDate(item.updatedAt) || "—"}
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
                        <LabStatusBadge status={String(item.oldValue)} />
                        <span className="text-gray-400" aria-hidden="true">→</span>
                    </>
                )}
                <LabStatusBadge status={String(item.newValue ?? "")} />
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

const LabViewModal = ({
    lab,
    isOpen,
    onClose,
    onEdit,
}: LabViewModalProps) => {
    if (!isOpen || !lab) {
        return null;
    }

    const history = (lab.updateHistory ?? []).slice().reverse();
    const uploadedCount = LAB_DOCUMENTS.filter(({ key }) => lab.documents?.[key]).length;

    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            title={
                <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span className="truncate tracking-wide">
                        {lab.lot || "Lab report"}
                    </span>
                    <span className="shrink-0">
                        <LabStatusBadge status={lab.status} />
                    </span>
                </span>
            }
            description={
                lab.createdAt && `Created ${formatLabDate(lab.createdAt)}`
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
                            Edit lab report
                        </CommonButton>
                    )}
                </div>
            }
        >
            <div className="space-y-3 bg-gray-50 p-3 sm:space-y-4 sm:p-6">
                <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
                    {/* ================= MAIN COLUMN ================= */}

                    <div className="min-w-0 space-y-3 sm:space-y-4 lg:col-span-2">
                        <ModalSection title="Lot details" icon={FlaskConical}>
                            <DetailGrid>
                                <DetailItem label="Lot" value={lab.lot} mono />
                                <DetailItem label="Size" value={lab.size} />
                                <DetailItem
                                    label="Lot description"
                                    value={lab.lotDescription}
                                    wide
                                />
                                {lab.status === "ON_HOLD" && (
                                    <DetailItem
                                        label="On hold reason"
                                        value={lab.holdReason}
                                        wide
                                    />
                                )}
                                {lab.status === "CANCELLED" && (
                                    <DetailItem
                                        label="Cancellation reason"
                                        value={lab.cancelReason}
                                        wide
                                    />
                                )}
                            </DetailGrid>
                        </ModalSection>

                        <ModalSection title="Lab report" icon={Microscope}>
                            <DetailGrid columns={3}>
                                {REPORT_FIELDS.map((field) => (
                                    <DetailItem
                                        key={field.key}
                                        label={reportFieldLabel(field)}
                                        value={lab.report?.[field.key]}
                                    />
                                ))}
                            </DetailGrid>
                        </ModalSection>

                        <ModalSection
                            title="Documents"
                            icon={FileText}
                            action={
                                <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-600">
                                    {uploadedCount} of {LAB_DOCUMENTS.length} uploaded
                                </span>
                            }
                        >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {LAB_DOCUMENTS.map(({ key, label }) => (
                                    <DocumentItem
                                        key={key}
                                        label={label}
                                        value={lab.documents?.[key] || null}
                                    />
                                ))}
                            </div>
                        </ModalSection>
                    </div>

                    {/* ================= SIDE COLUMN ================= */}

                    <div className="grid min-w-0 grid-cols-1 content-start items-start gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-1">
                        <ModalSection title="Assignment & timing" icon={CalendarClock}>
                            <dl className="space-y-3">
                                <DetailItem label="Assigned to" value={lab.assignedTo} />
                                <DetailItem label="Assigned by" value={lab.assignedBy} />
                                <DetailItem label="Sample taken by" value={lab.sampleTakenBy} />
                                <DetailItem label="Sample taken at" value={formatLabDate(lab.sampleTakenAt)} />
                                <DetailItem label="Expected report" value={formatLabDate(lab.expectedReportAt)} />
                                <DetailItem label="Report done" value={formatLabDate(lab.reportDoneAt)} />
                                <DetailItem label="Created" value={formatLabDate(lab.createdAt)} />
                                <DetailItem label="Created by" value={lab.createdBy} />
                                <DetailItem label="Last updated" value={formatLabDate(lab.updatedAt)} />
                                <DetailItem label="Last updated by" value={lab.updatedBy} />
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

export default LabViewModal;
