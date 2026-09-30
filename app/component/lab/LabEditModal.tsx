/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    CalendarClock,
    FileText,
    FlaskConical,
    Microscope,
    Save,
} from "lucide-react";

import type {
    LabDocuments,
    LabObject,
    LabReport,
    LabStatus,
} from "@/app/types/lab";

import CommonButton from "../vehicle_new/common/CommonButton";
import CommonFileUpload from "../vehicle_new/common/CommonFileUpload";
import CommonModal from "../vehicle_new/common/CommonModal";
import { FIELD_CLASS, FormField, ModalSection } from "../vehicle_new/common/ModalParts";
import { formatStatus } from "../vehicle_new/common/vehicleStatus";
import { LAB_STATUS_META, LabStatusBadge } from "./labStatus";
import { REPORT_FIELDS, reportFieldLabel } from "./LabColumns";
import { LAB_DOCUMENTS } from "./LabViewModal";

interface LabEditModalProps {
    lab: LabObject | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

/* =========================================================
   FORM DATA
========================================================= */

type TextField =
    | "lot"
    | "lotDescription"
    | "size"
    | "assignedTo"
    | "holdReason"
    | "cancelReason"
    | "sampleTakenBy";

type DateField = "sampleTakenAt" | "expectedReportAt" | "reportDoneAt";

interface LabFormData extends Record<TextField | DateField, string> {
    status: LabStatus;
    /** Kept as strings so a half-typed number isn't lost. */
    report: Partial<Record<keyof LabReport, string>>;
    documents: LabDocuments;
}

const STATUSES = Object.keys(LAB_STATUS_META) as LabStatus[];

/* ISO / Date -> datetime-local value (local time, no zone). */
const toDateTimeLocal = (value?: Date | string) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (n: number) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toFormData = (lab: LabObject): LabFormData => ({
    status: lab.status,
    lot: lab.lot ?? "",
    lotDescription: lab.lotDescription ?? "",
    size: lab.size ?? "",
    assignedTo: lab.assignedTo ?? "",
    holdReason: lab.holdReason ?? "",
    cancelReason: lab.cancelReason ?? "",
    sampleTakenBy: lab.sampleTakenBy ?? "",
    sampleTakenAt: toDateTimeLocal(lab.sampleTakenAt),
    expectedReportAt: toDateTimeLocal(lab.expectedReportAt),
    reportDoneAt: toDateTimeLocal(lab.reportDoneAt),
    report: Object.fromEntries(
        REPORT_FIELDS.map(({ key }) => [key, lab.report?.[key]?.toString() ?? ""]),
    ),
    documents: { ...lab.documents },
});

const REQUIRED_FIELDS: { key: TextField; label: string }[] = [
    { key: "lot", label: "Lot" },
    { key: "lotDescription", label: "Lot description" },
    { key: "size", label: "Size" },
    { key: "assignedTo", label: "Assigned to" },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function LabEditModal({
    lab,
    isOpen,
    onClose,
    onSuccess,
}: LabEditModalProps) {
    const [formData, setFormData] = useState<LabFormData | null>(null);

    const [saving, setSaving] = useState(false);

    const [uploading, setUploading] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (isOpen && lab) {
            setFormData(toFormData(lab));
            setUploading({});
        }
    }, [isOpen, lab]);

    if (!isOpen || !lab || !formData) {
        return null;
    }

    const isUploading = Object.values(uploading).some(Boolean);
    const isOnHold = formData.status === "ON_HOLD";
    const isCancelled = formData.status === "CANCELLED";

    const setField = <K extends keyof LabFormData>(key: K, value: LabFormData[K]) =>
        setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));

    /* =======================================================
       SAVE
    ======================================================= */

    const handleSave = async () => {
        // Trimmed text field; tolerates a field missing from the form state
        const text = (name: TextField) => formData[name]?.trim() ?? "";

        const missing = REQUIRED_FIELDS.find(({ key }) => !text(key));

        if (missing) {
            toast.error(`${missing.label} is required`);
            return;
        }

        if (isOnHold && !text("holdReason")) {
            toast.error("Hold reason is required while on hold");
            return;
        }

        if (isCancelled && !text("cancelReason")) {
            toast.error("Cancellation reason is required");
            return;
        }

        const report: LabReport = {};

        for (const field of REPORT_FIELDS) {
            const { key } = field;
            const raw = formData.report[key]?.trim();
            if (!raw) continue;

            const value = Number(raw);

            if (!Number.isFinite(value)) {
                toast.error(`${reportFieldLabel(field)} must be a number`);
                return;
            }

            report[key] = value;
        }

        const toIso = (value: string) =>
            value ? new Date(value).toISOString() : "";

        const payload = {
            status: formData.status,
            holdReason: isOnHold ? text("holdReason") : "",
            cancelReason: isCancelled ? text("cancelReason") : "",
            lot: text("lot").toUpperCase(),
            lotDescription: text("lotDescription"),
            size: text("size"),
            assignedTo: text("assignedTo"),
            sampleTakenBy: text("sampleTakenBy"),
            sampleTakenAt: toIso(formData.sampleTakenAt),
            expectedReportAt: toIso(formData.expectedReportAt),
            reportDoneAt: toIso(formData.reportDoneAt),
            report,
            documents: formData.documents,
        };

        try {
            setSaving(true);

            const response = await fetch(`/api/lab/${lab.sno}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.success) {
                throw new Error(result?.message || "Failed to update lab report");
            }

            toast.success(result?.message || "Lab report updated");
            onSuccess();
        } catch (error) {
            console.error("PUT lab update error:", error);

            toast.error(
                error instanceof Error ? error.message : "Failed to update lab report",
            );
        } finally {
            setSaving(false);
        }
    };

    /* =======================================================
       UI
    ======================================================= */

    const renderInput = (
        name: TextField,
        label: string,
        placeholder: string,
        { required = false, className = "", inputClassName = "" } = {},
    ) => (
        <FormField label={label} htmlFor={`edit-lab-${name}`} required={required} className={className}>
            <input
                id={`edit-lab-${name}`}
                value={formData[name] ?? ""}
                onChange={(e) => setField(name, e.target.value)}
                className={`${FIELD_CLASS} ${inputClassName}`}
                placeholder={placeholder}
                disabled={saving}
                autoComplete="off"
            />
        </FormField>
    );

    const renderDateTime = (name: DateField, label: string) => (
        <FormField label={label} htmlFor={`edit-lab-${name}`}>
            <input
                id={`edit-lab-${name}`}
                type="datetime-local"
                value={formData[name] ?? ""}
                onChange={(e) => setField(name, e.target.value)}
                className={FIELD_CLASS}
                disabled={saving}
            />
        </FormField>
    );

    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            closeOnOutsideClick={false}
            title={
                <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span className="truncate tracking-wide">
                        Edit {lab.lot}
                    </span>
                    <span className="shrink-0">
                        <LabStatusBadge status={formData.status} />
                    </span>
                </span>
            }
            description="Update lot details, status, report values and documents"
            footer={
                <div className="flex gap-2 sm:justify-end">
                    <CommonButton
                        variant="secondary"
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </CommonButton>

                    <CommonButton
                        icon={Save}
                        onClick={handleSave}
                        disabled={isUploading}
                        loading={saving}
                        loadingText="Saving..."
                        className="flex-1 sm:flex-none"
                    >
                        {isUploading ? "Uploading..." : "Save changes"}
                    </CommonButton>
                </div>
            }
        >
            <div className="space-y-3 bg-gray-50 p-3 sm:space-y-4 sm:p-6">
                {/* ================= LOT ================= */}

                <ModalSection title="Lot details" icon={FlaskConical}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {renderInput("lot", "Lot", "e.g. LOT-101", {
                            required: true,
                            inputClassName: "font-medium uppercase tracking-wide",
                        })}
                        {renderInput("size", "Size", "e.g. 0-10 mm", { required: true })}

                        <FormField
                            label="Lot description"
                            htmlFor="edit-lab-lotDescription"
                            required
                            className="sm:col-span-2"
                        >
                            <textarea
                                id="edit-lab-lotDescription"
                                value={formData.lotDescription}
                                onChange={(e) => setField("lotDescription", e.target.value)}
                                className={`${FIELD_CLASS} h-auto min-h-20 py-2`}
                                placeholder="Material, grade, stack location..."
                                disabled={saving}
                                rows={3}
                            />
                        </FormField>
                    </div>
                </ModalSection>

                {/* ================= STATUS & TIMING ================= */}

                <ModalSection title="Status & timing" icon={CalendarClock}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FormField label="Status" htmlFor="edit-lab-status">
                            <select
                                id="edit-lab-status"
                                value={formData.status}
                                onChange={(e) => setField("status", e.target.value as LabStatus)}
                                disabled={saving}
                                className={`${FIELD_CLASS} cursor-pointer`}
                            >
                                {STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {formatStatus(status)}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        {isOnHold &&
                            renderInput("holdReason", "Hold reason", "Why is it on hold?", {
                                required: true,
                                className: "sm:col-span-1 lg:col-span-2",
                            })}

                        {isCancelled &&
                            renderInput("cancelReason", "Cancellation reason", "Why was it cancelled?", {
                                required: true,
                                className: "sm:col-span-1 lg:col-span-2",
                            })}

                        {renderInput("assignedTo", "Assigned to", "Who will take the sample", {
                            required: true,
                        })}
                        {renderInput("sampleTakenBy", "Sample taken by", "Name")}
                        {renderDateTime("sampleTakenAt", "Sample taken at")}
                        {renderDateTime("expectedReportAt", "Expected report by")}
                        {renderDateTime("reportDoneAt", "Report done at")}
                    </div>
                </ModalSection>

                {/* ================= REPORT ================= */}

                <ModalSection title="Lab report" icon={Microscope}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {REPORT_FIELDS.map(({ key, ...field }) => (
                            <FormField key={key} label={reportFieldLabel({ key, ...field })} htmlFor={`edit-lab-report-${key}`}>
                                <input
                                    id={`edit-lab-report-${key}`}
                                    type="number"
                                    inputMode="decimal"
                                    step="any"
                                    value={formData.report[key] ?? ""}
                                    onChange={(e) =>
                                        setField("report", {
                                            ...formData.report,
                                            [key]: e.target.value,
                                        })
                                    }
                                    className={`${FIELD_CLASS} tabular-nums`}
                                    disabled={saving}
                                />
                            </FormField>
                        ))}
                    </div>
                </ModalSection>

                {/* ================= DOCUMENTS ================= */}

                <ModalSection title="Documents" icon={FileText}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {LAB_DOCUMENTS.map(({ key, label }) => (
                            <CommonFileUpload
                                key={key}
                                label={label}
                                value={formData.documents[key] || null}
                                onUpload={(url: string) =>
                                    // Functional update: uploads can finish in any order
                                    setFormData((prev) =>
                                        prev
                                            ? { ...prev, documents: { ...prev.documents, [key]: url } }
                                            : prev,
                                    )
                                }
                                onUploadingChange={(isBusy) =>
                                    setUploading((prev) => ({ ...prev, [key]: isBusy }))
                                }
                                disabled={saving}
                                maxSizeMB={100}
                            />
                        ))}
                    </div>
                </ModalSection>
            </div>
        </CommonModal>
    );
}
