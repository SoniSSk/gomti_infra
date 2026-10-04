/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    CalendarClock,
    MapPin,
    Paperclip,
    Plus,
    Save,
    Scale,
    Trash2,
    TriangleAlert,
    Truck,
} from "lucide-react";

import {
    MAX_MINING_FILES,
    MINING_STATUSES,
    MINING_TYPE_GROUPS,
    MINING_TYPES,
    WEIGHT_UNIT,
    computeActualWeight,
    formatMiningType,
    isMiningFieldRequired,
    miningReasonLabel,
    needsMiningReason,
    validateMining,
    type MiningInput,
    type MiningObject,
    type MiningStatus,
} from "@/app/types/mining";

import CommonButton from "../vehicle_new/common/CommonButton";
import CommonFileUpload from "../vehicle_new/common/CommonFileUpload";
import CommonModal from "../vehicle_new/common/CommonModal";
import { FIELD_CLASS, FormField, ModalSection } from "../vehicle_new/common/ModalParts";
import { formatStatus } from "../vehicle_new/common/vehicleStatus";
import { MiningStatusBadge } from "./miningStatus";
import { formatWeight } from "./MiningColumns";
import { getStoredUserRole, isSuperAdminRole } from "@/app/utils/vehiclePermissions";

interface MiningFormModalProps {
    /** The trip to edit, or null to add a new one. */
    trip: MiningObject | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

/* =========================================================
   FORM DATA
========================================================= */

type TextField =
    | "vehicleNo"
    | "miningType"
    | "lot"
    | "size"
    | "loadingPoint"
    | "loadingPerson"
    | "unloadingPoint"
    | "unloadingPerson"
    | "cancelReason";

type DateField = "loadedAt" | "unloadedAt";

/** Weights kept as strings so a half-typed number isn't lost. */
type WeightField = "emptyWeight" | "loadedWeight";

interface MiningFormData extends Record<TextField | DateField | WeightField, string> {
    status: MiningStatus;
    /** Uploaded weight slip URL; required once a loaded weight is entered. */
    weightSlip: string;
    /** Uploaded file URLs, in display order. */
    files: string[];
}

const MAX_FILE_MB = 50;

/* Images, videos, PDFs and office files (weight slips, challans...). */
const FILE_ACCEPT = "image/*,.pdf,video/*,.xls,.xlsx,.csv,.doc,.docx";

/* POST one file to /api/upload; resolves to its S3 URL. */
const uploadFile = async (file: File): Promise<string> => {
    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/upload", { method: "POST", body });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success || !data?.url) {
        throw new Error(data?.error || data?.message || "Upload failed");
    }

    return data.url;
};

const EMPTY_FORM: MiningFormData = {
    status: "EMPTY_WEIGHT",
    vehicleNo: "",
    miningType: "",
    lot: "",
    size: "",
    loadingPoint: "",
    loadingPerson: "",
    unloadingPoint: "",
    unloadingPerson: "",
    cancelReason: "",
    loadedAt: "",
    unloadedAt: "",
    emptyWeight: "",
    loadedWeight: "",
    weightSlip: "",
    files: [],
};

/* ISO / Date -> datetime-local value (local time, no zone). */
const toDateTimeLocal = (value?: Date | string) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (n: number) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toFormData = (trip: MiningObject): MiningFormData => ({
    status: trip.status,
    vehicleNo: trip.vehicleNo ?? "",
    miningType: trip.miningType ?? "",
    lot: trip.lot ?? "",
    size: trip.size ?? "",
    loadingPoint: trip.loadingPoint ?? "",
    loadingPerson: trip.loadingPerson ?? "",
    unloadingPoint: trip.unloadingPoint ?? "",
    unloadingPerson: trip.unloadingPerson ?? "",
    cancelReason: trip.cancelReason ?? "",
    loadedAt: toDateTimeLocal(trip.loadedAt),
    unloadedAt: toDateTimeLocal(trip.unloadedAt),
    emptyWeight: trip.emptyWeight?.toString() ?? "",
    loadedWeight: trip.loadedWeight?.toString() ?? "",
    weightSlip: trip.weightSlip?.url ?? "",
    files: (trip.files ?? []).map(({ url }) => url),
});

/* "" -> undefined, anything else -> Number (NaN is caught by validation). */
const toWeight = (value: string): number | undefined =>
    value.trim() ? Number(value) : undefined;

const toPayload = (form: MiningFormData): MiningInput => ({
    status: form.status,
    cancelReason: needsMiningReason(form.status) ? form.cancelReason.trim() : "",
    vehicleNo: form.vehicleNo.trim().toUpperCase(),
    miningType: form.miningType.trim(),
    lot: form.lot.trim().toUpperCase(),
    size: form.size.trim(),
    loadingPoint: form.loadingPoint.trim(),
    loadingPerson: form.loadingPerson.trim(),
    unloadingPoint: form.unloadingPoint.trim(),
    unloadingPerson: form.unloadingPerson.trim(),
    loadedAt: form.loadedAt ? new Date(form.loadedAt).toISOString() : "",
    unloadedAt: form.unloadedAt ? new Date(form.unloadedAt).toISOString() : "",
    emptyWeight: toWeight(form.emptyWeight),
    loadedWeight: toWeight(form.loadedWeight),
    weightSlip: form.weightSlip,
    files: form.files,
});

/* =========================================================
   COMPONENT
========================================================= */

export default function MiningFormModal({
    trip,
    isOpen,
    onClose,
    onSuccess,
}: MiningFormModalProps) {
    const isEdit = trip !== null;

    const [formData, setFormData] = useState<MiningFormData>(EMPTY_FORM);

    const [saving, setSaving] = useState(false);

    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [deleting, setDeleting] = useState(false);

    /* In-flight uploads, from the Add files button and the upload slots. */
    const [uploadCount, setUploadCount] = useState(0);

    const uploading = uploadCount > 0;

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Role lives in localStorage, so read it after mount
    useEffect(() => {
        setIsSuperAdmin(isSuperAdminRole(getStoredUserRole()));
    }, []);

    useEffect(() => {
        if (isOpen) {
            setFormData(trip ? toFormData(trip) : EMPTY_FORM);
            setShowDeleteConfirm(false);
            setUploadCount(0);
        }
    }, [isOpen, trip]);

    if (!isOpen) {
        return null;
    }

    const needsReason = needsMiningReason(formData.status);

    const emptyWeight = toWeight(formData.emptyWeight);
    const loadedWeight = toWeight(formData.loadedWeight);

    const weightError =
        emptyWeight !== undefined &&
        loadedWeight !== undefined &&
        loadedWeight < emptyWeight
            ? "Loaded weight can't be less than empty weight"
            : null;

    // The slip backs up the loaded weight, so it's needed once one is typed
    const needsWeightSlip = loadedWeight !== undefined;

    const actualWeight = weightError
        ? undefined
        : computeActualWeight(emptyWeight, loadedWeight);

    const setField = <K extends keyof MiningFormData>(key: K, value: MiningFormData[K]) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    const isRequired = (field: string) => isMiningFieldRequired(field, formData.status);

    // Unloaded at is required once unloading, so start it at now
    const setStatus = (status: MiningStatus) =>
        setFormData((prev) => ({
            ...prev,
            status,
            unloadedAt:
                status === "UNLOADING" && !prev.unloadedAt
                    ? toDateTimeLocal(new Date())
                    : prev.unloadedAt,
        }));

    /* =======================================================
       FILES
    ======================================================= */

    const trackUpload = (busy: boolean) =>
        setUploadCount((count) => Math.max(0, count + (busy ? 1 : -1)));

    /* Replace the file at index; "" (Remove) drops it. */
    const setFileAt = (index: number, url: string) =>
        setFormData((prev) => ({
            ...prev,
            files: url
                ? prev.files.map((file, i) => (i === index ? url : file))
                : prev.files.filter((_, i) => i !== index),
        }));

    const addFile = (url: string) => {
        if (!url) return;

        // Functional update: uploads finish in any order
        setFormData((prev) => ({ ...prev, files: [...prev.files, url] }));
    };

    const handleAddFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const picked = Array.from(event.target.files ?? []);
        event.target.value = "";

        const tooLarge = picked.filter((file) => file.size > MAX_FILE_MB * 1024 * 1024);
        if (tooLarge.length) {
            toast.error(
                `${tooLarge.map((file) => file.name).join(", ")} ${tooLarge.length === 1 ? "is" : "are"} over ${MAX_FILE_MB} MB`,
            );
        }

        const room = MAX_MINING_FILES - formData.files.length - uploadCount;
        const valid = picked.filter((file) => !tooLarge.includes(file));
        const toUpload = valid.slice(0, Math.max(0, room));

        if (toUpload.length < valid.length) {
            toast.error(`At most ${MAX_MINING_FILES} files per trip`);
        }

        if (!toUpload.length) return;

        setUploadCount((count) => count + toUpload.length);

        const results = await Promise.allSettled(
            toUpload.map(async (file) => {
                try {
                    addFile(await uploadFile(file));
                } catch (error) {
                    console.error("Mining file upload error:", error);
                    toast.error(`${file.name}: ${error instanceof Error ? error.message : "Upload failed"}`);
                    throw error;
                } finally {
                    trackUpload(false);
                }
            }),
        );

        const done = results.filter((result) => result.status === "fulfilled").length;
        if (done) {
            toast.success(`${done} file${done === 1 ? "" : "s"} uploaded`);
        }
    };

    /* =======================================================
       SAVE
    ======================================================= */

    const handleSave = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (uploading) return;

        const payload = toPayload(formData);

        const problem = validateMining(payload);

        if (problem) {
            toast.error(problem);
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(
                isEdit ? `/api/mining/${trip.sno}` : "/api/mining",
                {
                    method: isEdit ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                },
            );

            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.success) {
                throw new Error(result?.message || "Failed to save trip");
            }

            toast.success(result?.message || (isEdit ? "Trip updated" : "Trip added"));
            onSuccess();
        } catch (error) {
            console.error("Mining save error:", error);

            toast.error(error instanceof Error ? error.message : "Failed to save trip");
        } finally {
            setSaving(false);
        }
    };

    /* =======================================================
       DELETE
    ======================================================= */

    const handleDelete = async () => {
        if (deleting || !trip) return;

        try {
            setDeleting(true);

            const response = await fetch(`/api/mining/${trip.sno}`, {
                method: "DELETE",
            });

            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.success) {
                throw new Error(result?.message || "Failed to delete trip");
            }

            toast.success(result?.message || "Trip deleted");
            setShowDeleteConfirm(false);
            onSuccess();
        } catch (error) {
            console.error("DELETE mining error:", error);

            toast.error(error instanceof Error ? error.message : "Failed to delete trip");
        } finally {
            setDeleting(false);
        }
    };

    /* =======================================================
       UI
    ======================================================= */

    const renderInput = (
        name: TextField,
        label: string,
        placeholder: string,
        { className = "", inputClassName = "" }: {
            className?: string;
            inputClassName?: string;
        } = {},
    ) => (
        <FormField
            label={label}
            htmlFor={`mining-${name}`}
            required={isRequired(name) || name === "cancelReason"}
            className={className}
        >
            <input
                id={`mining-${name}`}
                value={formData[name]}
                onChange={(e) => setField(name, e.target.value)}
                className={`${FIELD_CLASS} ${inputClassName}`}
                placeholder={placeholder}
                disabled={saving}
                autoComplete="off"
            />
        </FormField>
    );

    const renderDateTime = (name: DateField, label: string, hint: string) => (
        <FormField
            label={label}
            htmlFor={`mining-${name}`}
            hint={hint}
            required={isRequired(name)}
        >
            <input
                id={`mining-${name}`}
                type="datetime-local"
                value={formData[name]}
                onChange={(e) => setField(name, e.target.value)}
                className={FIELD_CLASS}
                disabled={saving}
            />
        </FormField>
    );

    const renderWeight = (name: WeightField, label: string) => (
        <FormField
            label={`${label} (${WEIGHT_UNIT})`}
            htmlFor={`mining-${name}`}
            required={isRequired(name)}
        >
            <input
                id={`mining-${name}`}
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={formData[name]}
                onChange={(e) => setField(name, e.target.value)}
                className={`${FIELD_CLASS} tabular-nums`}
                placeholder="0.000"
                disabled={saving}
            />
        </FormField>
    );

    return (
        <>
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            closeOnOutsideClick={false}
            title={
                <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span className="truncate tracking-wide">
                        {isEdit ? `Edit ${trip.vehicleNo}` : "Add mining trip"}
                    </span>
                    <span className="shrink-0">
                        <MiningStatusBadge status={formData.status} />
                    </span>
                </span>
            }
            description={
                isEdit
                    ? "Update trip details, weights and status"
                    : "Record a vehicle trip from loading to unloading."
            }
            footer={
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Cancel and Delete on the left, the primary action on the right */}
                    <CommonButton
                        variant="secondary"
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </CommonButton>

                    {/* Icon-only on phones so all buttons share one row */}
                    {isEdit && isSuperAdmin && (
                        <CommonButton
                            variant="danger"
                            icon={Trash2}
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={saving}
                            aria-label="Delete trip"
                            title="Delete trip"
                            className="max-sm:w-10 max-sm:px-0"
                        >
                            <span className="hidden sm:inline">Delete</span>
                        </CommonButton>
                    )}

                    <CommonButton
                        icon={isEdit ? Save : Plus}
                        onClick={() => handleSave()}
                        disabled={Boolean(weightError) || uploading}
                        loading={saving}
                        loadingText="Saving..."
                        className="flex-1 sm:ml-auto sm:flex-none"
                    >
                        {uploading ? "Uploading..." : isEdit ? "Save changes" : "Add trip"}
                    </CommonButton>
                </div>
            }
        >
            <form
                onSubmit={handleSave}
                className="space-y-3 bg-gray-50 p-3 sm:space-y-4 sm:p-6"
                noValidate
            >
                {/* ================= TRIP ================= */}

                <ModalSection title="Trip details" icon={Truck}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {renderInput("vehicleNo", "Vehicle no", "e.g. UP32AB1234", {
                            inputClassName: "font-medium uppercase tracking-wide",
                        })}
                        <FormField
                            label="Type of mining"
                            htmlFor="mining-miningType"
                            required={isRequired("miningType")}
                        >
                            <select
                                id="mining-miningType"
                                value={formData.miningType}
                                onChange={(e) => setField("miningType", e.target.value)}
                                disabled={saving}
                                className={`${FIELD_CLASS} cursor-pointer`}
                            >
                                <option value="">Select type</option>
                                {/* Keep a value saved before this list existed */}
                                {formData.miningType && !MINING_TYPES.includes(formData.miningType) && (
                                    <option value={formData.miningType}>{formData.miningType}</option>
                                )}
                                {MINING_TYPE_GROUPS.map(({ operation, materials }) => (
                                    <optgroup key={operation} label={operation}>
                                        {materials.map((material) => {
                                            const type = formatMiningType(operation, material);
                                            return (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            );
                                        })}
                                    </optgroup>
                                ))}
                            </select>
                        </FormField>

                        <FormField label="Status" htmlFor="mining-status">
                            <select
                                id="mining-status"
                                value={formData.status}
                                onChange={(e) => setStatus(e.target.value as MiningStatus)}
                                disabled={saving}
                                className={`${FIELD_CLASS} cursor-pointer`}
                            >
                                {MINING_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {formatStatus(status)}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        {renderInput("lot", "Lot", "e.g. LOT-101 (optional)", {
                            inputClassName: "font-medium uppercase tracking-wide",
                        })}
                        {renderInput("size", "Size", "e.g. 0-10 mm (optional)")}

                        {needsReason &&
                            renderInput("cancelReason", miningReasonLabel(formData.status), "Why?", {
                                className: "sm:col-span-2 lg:col-span-3",
                            })}
                    </div>
                </ModalSection>

                {/* ================= WEIGHTS ================= */}

                <ModalSection title="Weights" icon={Scale}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {renderWeight("emptyWeight", "Empty weight")}
                        {renderWeight("loadedWeight", "Loaded weight")}

                        <FormField
                            label={`Actual weight (${WEIGHT_UNIT})`}
                            htmlFor="mining-actualWeight"
                            hint="Loaded − empty"
                            error={weightError}
                        >
                            <input
                                id="mining-actualWeight"
                                value={formatWeight(actualWeight)}
                                placeholder="—"
                                className={`${FIELD_CLASS} cursor-not-allowed bg-gray-50 font-semibold tabular-nums`}
                                readOnly
                                disabled
                            />
                        </FormField>

                        <div className="sm:col-span-3">
                            <CommonFileUpload
                                label="Weight slip"
                                accept={FILE_ACCEPT}
                                value={formData.weightSlip || null}
                                onUpload={(url: string) => setField("weightSlip", url)}
                                onUploadingChange={trackUpload}
                                disabled={saving}
                                required={needsWeightSlip}
                                maxSizeMB={MAX_FILE_MB}
                            />
                            {needsWeightSlip && !formData.weightSlip && (
                                <p className="mt-1.5 text-xs text-red-600">
                                    Required with a loaded weight
                                </p>
                            )}
                        </div>
                    </div>
                </ModalSection>

                {/* ================= LOADING / UNLOADING ================= */}

                <ModalSection title="Loading & unloading" icon={MapPin}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {renderInput("loadingPoint", "Loading point", "Where it was loaded")}
                        {renderInput("loadingPerson", "Loading person", "Name")}
                        {renderDateTime("loadedAt", "Loaded at", "Set automatically when in transit")}

                        {renderInput("unloadingPoint", "Unloading point", "Where it goes")}
                        {renderInput("unloadingPerson", "Unloading person", "Name")}
                        {renderDateTime("unloadedAt", "Unloaded at", "Defaults to now when marked unloading")}
                    </div>
                </ModalSection>

                {/* ================= FILES ================= */}

                <ModalSection
                    title="Files"
                    description="Weight slips, challans, photos..."
                    icon={Paperclip}
                    action={
                        <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-600">
                            {formData.files.length} / {MAX_MINING_FILES}
                        </span>
                    }
                >
                    <div className="space-y-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={FILE_ACCEPT}
                            onChange={handleAddFiles}
                            className="hidden"
                        />

                        <CommonButton
                            variant="secondary"
                            size="sm"
                            icon={Paperclip}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={saving || formData.files.length + uploadCount >= MAX_MINING_FILES}
                        >
                            Add files
                        </CommonButton>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {formData.files.map((url, index) => (
                                <CommonFileUpload
                                    key={url}
                                    label={`File ${index + 1}`}
                                    accept={FILE_ACCEPT}
                                    value={url}
                                    onUpload={(next: string) => setFileAt(index, next)}
                                    onUploadingChange={trackUpload}
                                    disabled={saving}
                                    maxSizeMB={MAX_FILE_MB}
                                />
                            ))}

                            {/* Always at least one slot to drop a single file into */}
                            {formData.files.length === 0 && (
                                <CommonFileUpload
                                    key="new"
                                    label="File 1"
                                    accept={FILE_ACCEPT}
                                    value={null}
                                    onUpload={addFile}
                                    onUploadingChange={trackUpload}
                                    disabled={saving}
                                    maxSizeMB={MAX_FILE_MB}
                                />
                            )}
                        </div>
                    </div>
                </ModalSection>

                {isEdit && (
                    <p className="flex items-center gap-1.5 px-1 text-xs text-gray-500">
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                        Every change is recorded in the trip&apos;s activity history.
                    </p>
                )}

                {/* Lets Enter submit from any field */}
                <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
            </form>
        </CommonModal>

        {/* ================= DELETE CONFIRMATION ================= */}

        <CommonModal
            isOpen={showDeleteConfirm && isSuperAdmin && isEdit}
            onClose={() => setShowDeleteConfirm(false)}
            size="sm"
            showCloseButton={false}
            closeOnOutsideClick={!deleting}
            footer={
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <CommonButton
                        variant="secondary"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deleting}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </CommonButton>

                    <CommonButton
                        variant="destructive"
                        icon={Trash2}
                        onClick={handleDelete}
                        loading={deleting}
                        loadingText="Deleting..."
                        className="w-full sm:w-auto"
                    >
                        Delete trip
                    </CommonButton>
                </div>
            }
        >
            <div className="flex gap-3 p-4 sm:gap-4 sm:p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <TriangleAlert className="h-5 w-5" aria-hidden="true" />
                </span>

                <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-gray-900">
                        Delete trip {trip?.vehicleNo}?
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        This permanently removes the trip and its update history. This action cannot be undone.
                    </p>
                </div>
            </div>
        </CommonModal>
        </>
    );
}
