/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    ClipboardList,
    FileText,
    Landmark,
    Paperclip,
    Plus,
    Save,
    Tags,
    Trash2,
    TriangleAlert,
} from "lucide-react";

import {
    BRANCHES,
    DOCUMENT_TYPES,
    OPERATION_CATEGORIES,
    OPERATION_STATUSES,
    OPERATION_TYPES,
    PRIORITIES,
    MAX_DOCUMENT_FILES,
    getDocumentFiles,
    isOtherType,
    isReasonRequired,
    validateOperation,
    type AccountBook,
    type BusinessOperation,
    type BusinessOperationInput,
} from "@/app/types/accounts";

import CommonButton from "../vehicle_new/common/CommonButton";
import CommonFileUpload from "../vehicle_new/common/CommonFileUpload";
import CommonModal from "../vehicle_new/common/CommonModal";
import { FIELD_CLASS, FormField, ModalSection } from "../vehicle_new/common/ModalParts";
import { OperationStatusBadge } from "./accountsStatus";
import { getStoredUserRole, isSuperAdminRole } from "@/app/utils/vehiclePermissions";

interface AccountsFormModalProps {
    /** Book the entry belongs to: its accounts and API collection. */
    book: AccountBook;
    /** null opens an empty form to add an entry. */
    operation: BusinessOperation | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

/* =========================================================
   FORM DATA

   Flat strings so every input is controlled; turned back
   into the nested BusinessOperation shape on save.
========================================================= */

interface FormData {
    name: string;
    description: string;
    account: string;
    category: string;
    typeValue: string;
    otherReason: string;
    status: string;
    statusReason: string;
    referenceNo: string;
    priority: string;
    assignedTo: string;
    branch: string;
    documentType: string;
    documentName: string;
    documentNumber: string;
    /** yyyy-mm-dd for <input type="date">. */
    documentDate: string;
    /** Uploaded file URLs, in display order. */
    files: string[];
    remarks: string;
}

type TextField = Exclude<keyof FormData, "files">;

const MAX_FILE_MB = 50;

/* Same types the single-file picker takes, plus office files for statements. */
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

const EMPTY_FORM: FormData = {
    name: "",
    description: "",
    account: "",
    category: "",
    typeValue: "",
    otherReason: "",
    status: "Pending",
    statusReason: "",
    referenceNo: "",
    priority: "",
    assignedTo: "",
    branch: "",
    documentType: "",
    documentName: "",
    documentNumber: "",
    documentDate: "",
    files: [],
    remarks: "",
};

/* ISO / Date -> yyyy-mm-dd in local time. */
const toDateInput = (value?: Date | string) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (n: number) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const toFormData = (row: BusinessOperation): FormData => ({
    name: row.name ?? "",
    description: row.description ?? "",
    account: row.account ?? "",
    category: row.type?.category ?? "",
    typeValue: row.type?.value ?? "",
    otherReason: row.type?.other_reason ?? "",
    status: row.status?.value ?? "Pending",
    statusReason: row.status?.reason ?? "",
    referenceNo: row.tracking?.reference_no ?? "",
    priority: row.tracking?.priority ?? "",
    assignedTo: row.tracking?.assigned_to ?? "",
    branch: row.tracking?.branch ?? "",
    documentType: row.document?.type ?? "",
    documentName: row.document?.document_name ?? "",
    documentNumber: row.document?.document_number ?? "",
    documentDate: toDateInput(row.document?.document_date),
    files: getDocumentFiles(row.document).map(({ url }) => url),
    remarks: row.document?.remarks ?? "",
});

const toPayload = (form: FormData) =>
    ({
        name: form.name.trim(),
        description: form.description.trim(),
        account: form.account,
        type: {
            category: form.category,
            value: form.typeValue,
            other_reason: form.otherReason.trim(),
        },
        status: {
            value: form.status,
            reason: form.statusReason.trim(),
        },
        tracking: {
            reference_no: form.referenceNo.trim(),
            priority: form.priority,
            assigned_to: form.assignedTo.trim(),
            branch: form.branch,
        },
        document: {
            type: form.documentType,
            document_name: form.documentName.trim(),
            document_number: form.documentNumber.trim(),
            // Noon local, so the calendar day survives the UTC round trip
            document_date: form.documentDate
                ? new Date(`${form.documentDate}T12:00:00`).toISOString()
                : "",
            files: form.files,
            remarks: form.remarks.trim(),
        },
    }) as BusinessOperationInput;

/* =========================================================
   COMPONENT
========================================================= */

export default function AccountsFormModal({
    book,
    operation,
    isOpen,
    onClose,
    onSuccess,
}: AccountsFormModalProps) {
    const isEdit = Boolean(operation);

    const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

    const [saving, setSaving] = useState(false);

    /* In-flight uploads, from the Add files button and the upload slots. */
    const [uploadCount, setUploadCount] = useState(0);

    const uploading = uploadCount > 0;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [deleting, setDeleting] = useState(false);

    // Role lives in localStorage, so read it after mount
    useEffect(() => {
        setIsSuperAdmin(isSuperAdminRole(getStoredUserRole()));
    }, []);

    useEffect(() => {
        if (isOpen) {
            setFormData(operation ? toFormData(operation) : EMPTY_FORM);
            setUploadCount(0);
            setShowDeleteConfirm(false);
        }
    }, [isOpen, operation]);

    if (!isOpen) {
        return null;
    }

    const showOtherReason = isOtherType(formData.typeValue);
    const reasonRequired = isReasonRequired(formData.status);

    const setField = (key: TextField, value: string) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    /*
     * One "Category" dropdown lists every type grouped under its
     * category. "Other" exists in several categories, so each option
     * carries both: "Payment|Refund".
     */
    const typeKey = formData.category && formData.typeValue
        ? `${formData.category}|${formData.typeValue}`
        : "";

    const handleTypeChange = (key: string) => {
        const [category = "", typeValue = ""] = key.split("|");

        setFormData((prev) => ({ ...prev, category, typeValue }));
    };

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

        const room = MAX_DOCUMENT_FILES - formData.files.length - uploadCount;
        const valid = picked.filter((file) => !tooLarge.includes(file));
        const toUpload = valid.slice(0, Math.max(0, room));

        if (toUpload.length < valid.length) {
            toast.error(`At most ${MAX_DOCUMENT_FILES} files per entry`);
        }

        if (!toUpload.length) return;

        setUploadCount((count) => count + toUpload.length);

        const results = await Promise.allSettled(
            toUpload.map(async (file) => {
                try {
                    addFile(await uploadFile(file));
                } catch (error) {
                    console.error("Accounts file upload error:", error);
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

    const handleSave = async () => {
        const payload = toPayload(formData);

        const problem = validateOperation(payload, book);

        if (problem) {
            toast.error(problem);
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(
                `/api/accounts${isEdit ? `/${operation?.sno}` : ""}?book=${book.key}`,
                {
                    method: isEdit ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                },
            );

            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.success) {
                throw new Error(result?.message || "Failed to save entry");
            }

            toast.success(result?.message || "Entry saved");
            onSuccess();
        } catch (error) {
            console.error("Accounts save error:", error);

            toast.error(
                error instanceof Error ? error.message : "Failed to save entry",
            );
        } finally {
            setSaving(false);
        }
    };

    /* =======================================================
       DELETE
    ======================================================= */

    const handleDelete = async () => {
        if (deleting || !operation) return;

        try {
            setDeleting(true);

            const response = await fetch(`/api/accounts/${operation.sno}?book=${book.key}`, {
                method: "DELETE",
            });

            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.success) {
                throw new Error(result?.message || "Failed to delete entry");
            }

            toast.success(result?.message || "Entry deleted");
            setShowDeleteConfirm(false);
            onSuccess();
        } catch (error) {
            console.error("DELETE accounts error:", error);

            toast.error(
                error instanceof Error ? error.message : "Failed to delete entry",
            );
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
        { required = false, className = "", inputClassName = "", type = "text" } = {},
    ) => (
        <FormField label={label} htmlFor={`accounts-${name}`} required={required} className={className}>
            <input
                id={`accounts-${name}`}
                type={type}
                value={formData[name]}
                onChange={(e) => setField(name, e.target.value)}
                className={`${FIELD_CLASS} ${inputClassName}`}
                placeholder={placeholder}
                disabled={saving}
                autoComplete="off"
            />
        </FormField>
    );

    const renderSelect = (
        name: TextField,
        label: string,
        options: readonly string[],
        { required = false, placeholder = "Select..." } = {},
    ) => (
        <FormField label={label} htmlFor={`accounts-${name}`} required={required}>
            <select
                id={`accounts-${name}`}
                value={formData[name]}
                onChange={(e) => setField(name, e.target.value)}
                disabled={saving}
                className={`${FIELD_CLASS} cursor-pointer`}
            >
                {/* Required selects can't go back to empty once chosen */}
                <option value="" disabled={required}>
                    {placeholder}
                </option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </FormField>
    );

    const renderTextarea = (
        name: TextField,
        label: string,
        placeholder: string,
        { required = false, className = "sm:col-span-2" } = {},
    ) => (
        <FormField label={label} htmlFor={`accounts-${name}`} required={required} className={className}>
            <textarea
                id={`accounts-${name}`}
                value={formData[name]}
                onChange={(e) => setField(name, e.target.value)}
                className={`${FIELD_CLASS} h-auto min-h-20 py-2`}
                placeholder={placeholder}
                disabled={saving}
                rows={3}
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
                    <span className="truncate">
                        {isEdit ? `Edit ${operation?.name || "entry"}` : `Add ${book.title} entry`}
                    </span>
                    <span className="shrink-0">
                        <OperationStatusBadge status={formData.status} />
                    </span>
                </span>
            }
            description={
                isEdit
                    ? operation?.tracking?.id
                    : "Log a payment, transaction, master change, compliance task or report."
            }
            footer={
                <div className="flex items-center gap-2 sm:justify-between sm:gap-3">
                    {/* Icon-only on phones so Cancel / Save share one row */}
                    <div className="flex items-center gap-3 empty:hidden">
                        {isEdit && isSuperAdmin && (
                            <CommonButton
                                variant="danger"
                                icon={Trash2}
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={saving}
                                aria-label="Delete entry"
                                title="Delete entry"
                                className="max-sm:w-10 max-sm:px-0"
                            >
                                <span className="hidden sm:inline">Delete</span>
                            </CommonButton>
                        )}
                    </div>

                    <div className="flex min-w-0 flex-1 gap-2 sm:flex-none sm:justify-end">
                        <CommonButton
                            variant="secondary"
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 sm:flex-none"
                        >
                            Cancel
                        </CommonButton>

                        <CommonButton
                            icon={isEdit ? Save : Plus}
                            onClick={handleSave}
                            disabled={uploading}
                            loading={saving}
                            loadingText="Saving..."
                            className="flex-1 sm:flex-none"
                        >
                            {uploading
                                ? "Uploading..."
                                : isEdit
                                    ? "Save changes"
                                    : "Add entry"}
                        </CommonButton>
                    </div>
                </div>
            }
        >
            <div className="space-y-3 bg-gray-50 p-3 sm:space-y-4 sm:p-6">
                {/* ================= DETAILS ================= */}

                <ModalSection title="Details" icon={Landmark}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {renderInput("name", "Payment for", "e.g. Diesel bill – Sept", { required: true })}
                        <FormField label="Account" htmlFor="accounts-account" required>
                            <select
                                id="accounts-account"
                                value={formData.account}
                                onChange={(e) => setField("account", e.target.value)}
                                disabled={saving}
                                className={`${FIELD_CLASS} cursor-pointer`}
                            >
                                <option value="" disabled>
                                    Select account
                                </option>
                                {/* Grouped books (cards / banks) get headings */}
                                {book.accountGroups.map(({ label, accounts }) => {
                                    const options = accounts.map((account) => (
                                        <option key={account} value={account}>
                                            {account}
                                        </option>
                                    ));

                                    return label ? (
                                        <optgroup key={label} label={label}>
                                            {options}
                                        </optgroup>
                                    ) : (
                                        <React.Fragment key="accounts">{options}</React.Fragment>
                                    );
                                })}
                            </select>
                        </FormField>
                        {renderTextarea("description", "Description", "What is this entry for?")}
                    </div>
                </ModalSection>

                {/* ================= TYPE & STATUS ================= */}

                <ModalSection title="Type & status" icon={Tags}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Category" htmlFor="accounts-type" required>
                            <select
                                id="accounts-type"
                                value={typeKey}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                disabled={saving}
                                className={`${FIELD_CLASS} cursor-pointer`}
                            >
                                <option value="" disabled>
                                    Select category
                                </option>
                                {OPERATION_CATEGORIES.map((category) => (
                                    <optgroup key={category} label={category}>
                                        {OPERATION_TYPES[category].map((type) => (
                                            <option key={type} value={`${category}|${type}`}>
                                                {type}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </FormField>

                        {renderSelect("branch", "Branch", BRANCHES, { placeholder: "Select branch" })}

                        {showOtherReason &&
                            renderInput("otherReason", "Describe the category", "What kind of operation is this?", {
                                required: true,
                                className: "sm:col-span-2",
                            })}

                        {renderSelect("status", "Status", OPERATION_STATUSES, { required: true })}
                        {renderInput(
                            "statusReason",
                            "Status reason",
                            reasonRequired ? `Why is it ${formData.status.toLowerCase()}?` : "Optional",
                            { required: reasonRequired },
                        )}
                    </div>
                </ModalSection>

                {/* ================= TRACKING ================= */}

                <ModalSection title="Tracking" icon={ClipboardList}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {renderInput("referenceNo", "Reference no.", "UTR / cheque / voucher no.", {
                            inputClassName: "font-mono",
                        })}
                        {renderSelect("priority", "Priority", PRIORITIES, { placeholder: "None" })}
                        {renderInput("assignedTo", "Assigned to", "Who handles this")}
                    </div>
                </ModalSection>

                {/* ================= DOCUMENT ================= */}

                <ModalSection title="Document" icon={FileText}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {renderSelect("documentType", "Document type", DOCUMENT_TYPES, { placeholder: "None" })}
                        {renderInput("documentName", "Document name", "e.g. Invoice from vendor")}
                        {renderInput("documentNumber", "Document number", "e.g. INV-2026-104", {
                            inputClassName: "font-mono",
                        })}
                        {renderInput("documentDate", "Document date", "", { type: "date" })}
                        {renderTextarea("remarks", "Remarks", "Anything to note about the document", {
                            className: "sm:col-span-2",
                        })}

                        <div className="space-y-3 sm:col-span-2 lg:col-span-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium text-gray-700">
                                    Files
                                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-600">
                                        {formData.files.length} / {MAX_DOCUMENT_FILES}
                                    </span>
                                </p>

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
                                    disabled={saving || formData.files.length + uploadCount >= MAX_DOCUMENT_FILES}
                                >
                                    Add files
                                </CommonButton>
                            </div>

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
                    </div>
                </ModalSection>
            </div>
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
                        Delete entry
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
                        Delete {operation?.name || "this entry"}?
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        This permanently removes the entry, its document link and update history. This action cannot be undone.
                    </p>
                </div>
            </div>
        </CommonModal>
        </>
    );
}
