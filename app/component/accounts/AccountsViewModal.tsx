"use client";

import React from "react";
import {
    Activity,
    ClipboardList,
    FileText,
    Landmark,
    Pencil,
} from "lucide-react";

import {
    getDocumentFiles,
    type BusinessOperation,
    type OperationFieldUpdate,
} from "@/app/types/accounts";

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
import { OperationStatusBadge, PriorityBadge } from "./accountsStatus";
import {
    formatAccountsDate,
    formatAccountsDay,
    operationTypeLabel,
} from "./AccountsColumns";

interface AccountsViewModalProps {
    operation: BusinessOperation | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
}

/* =========================================================
   HELPERS
========================================================= */

/** "document_date" -> "Document date" */
const formatField = (field: string) => {
    const spaced = field
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replaceAll("_", " ")
        .toLowerCase();

    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const DATE_KEY = /(_date|At)$/;

/* Nested groups (type, status, document...) read as "key: value, ...". */
const formatValue = (value: unknown, key = ""): string => {
    if (isEmptyValue(value)) {
        return "—";
    }

    // URLs are long; the count says enough in the history
    if (Array.isArray(value)) {
        return key === "files"
            ? `${value.length} file${value.length === 1 ? "" : "s"}`
            : value.map((item) => formatValue(item)).join(", ");
    }

    if (DATE_KEY.test(key)) {
        return formatAccountsDate(value as string) || String(value);
    }

    if (typeof value === "object") {
        const parts = Object.entries(value as Record<string, unknown>)
            .filter(([, v]) => !isEmptyValue(v))
            .map(([k, v]) => `${formatField(k)}: ${formatValue(v, k)}`);

        return parts.length ? parts.join(", ") : "—";
    }

    return String(value);
};

/* =========================================================
   HISTORY ENTRY
========================================================= */

const HistoryEntry = ({
    item,
    isLast,
}: {
    item: OperationFieldUpdate;
    isLast: boolean;
}) => {
    const statusOf = (value: unknown) =>
        (value as { value?: string } | null)?.value;

    return (
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
                    {formatAccountsDate(item.updatedAt) || "—"}
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
                    {statusOf(item.oldValue) && (
                        <>
                            <OperationStatusBadge status={statusOf(item.oldValue)} />
                            <span className="text-gray-400" aria-hidden="true">→</span>
                        </>
                    )}
                    <OperationStatusBadge status={statusOf(item.newValue)} />
                </div>
            ) : (
                <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                    <span className="break-all text-gray-400 line-through">
                        {formatValue(item.oldValue)}
                    </span>
                    <span className="text-gray-400" aria-hidden="true">→</span>
                    <span className="break-all text-gray-900">
                        {formatValue(item.newValue)}
                    </span>
                </p>
            )}
        </li>
    );
};

/* =========================================================
   VIEW MODAL
========================================================= */

const AccountsViewModal = ({
    operation,
    isOpen,
    onClose,
    onEdit,
}: AccountsViewModalProps) => {
    if (!isOpen || !operation) {
        return null;
    }

    const { tracking = {} as BusinessOperation["tracking"], document = {} } = operation;
    const files = getDocumentFiles(document);
    const history = (operation.update_history ?? []).slice().reverse();

    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            title={
                <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span className="truncate">
                        {operation.name || "Accounts entry"}
                    </span>
                    <span className="shrink-0">
                        <OperationStatusBadge status={operation.status?.value} />
                    </span>
                </span>
            }
            description={
                [tracking.id, tracking.created_date && `Created ${formatAccountsDate(tracking.created_date)}`]
                    .filter(Boolean)
                    .join(" · ")
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
                            Edit entry
                        </CommonButton>
                    )}
                </div>
            }
        >
            <div className="space-y-3 bg-gray-50 p-3 sm:space-y-4 sm:p-6">
                <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
                    {/* ================= MAIN COLUMN ================= */}

                    <div className="min-w-0 space-y-3 sm:space-y-4 lg:col-span-2">
                        <ModalSection title="Details" icon={Landmark}>
                            <DetailGrid>
                                <DetailItem label="Account" value={operation.account} />
                                <DetailItem label="Category" value={operation.type?.category} />
                                <DetailItem label="Type" value={operationTypeLabel(operation)} />
                                <DetailItem label="Branch" value={tracking.branch} />
                                <DetailItem
                                    label="Status"
                                    value={<OperationStatusBadge status={operation.status?.value} />}
                                />
                                {operation.status?.reason && (
                                    <DetailItem
                                        label="Status reason"
                                        value={operation.status.reason}
                                        wide
                                    />
                                )}
                                <DetailItem
                                    label="Description"
                                    value={operation.description}
                                    wide
                                />
                            </DetailGrid>
                        </ModalSection>

                        <ModalSection
                            title="Document"
                            icon={FileText}
                            action={
                                <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-600">
                                    {files.length} file{files.length === 1 ? "" : "s"}
                                </span>
                            }
                        >
                            <DetailGrid>
                                <DetailItem label="Type" value={document.type} />
                                <DetailItem label="Name" value={document.document_name} />
                                <DetailItem label="Number" value={document.document_number} mono />
                                <DetailItem label="Date" value={formatAccountsDay(document.document_date)} />
                                <DetailItem label="Remarks" value={document.remarks} wide />
                            </DetailGrid>

                            <div className="mt-4">
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
                                                {(file.uploaded_by || file.uploaded_date) && (
                                                    <p className="mt-1.5 text-xs text-gray-500">
                                                        Uploaded
                                                        {file.uploaded_by && <> by <span className="font-medium text-gray-700">{file.uploaded_by}</span></>}
                                                        {file.uploaded_date && <> on {formatAccountsDate(file.uploaded_date)}</>}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyNote>No files uploaded</EmptyNote>
                                )}
                            </div>
                        </ModalSection>
                    </div>

                    {/* ================= SIDE COLUMN ================= */}

                    <div className="grid min-w-0 grid-cols-1 content-start items-start gap-3 sm:gap-4">
                        <ModalSection title="Tracking" icon={ClipboardList}>
                            <dl className="space-y-3">
                                <DetailItem label="ID" value={tracking.id} mono />
                                <DetailItem label="Reference no." value={tracking.reference_no} mono />
                                <DetailItem
                                    label="Priority"
                                    value={tracking.priority && <PriorityBadge priority={tracking.priority} />}
                                />
                                <DetailItem label="Assigned to" value={tracking.assigned_to} />
                                <DetailItem label="Created" value={formatAccountsDate(tracking.created_date)} />
                                <DetailItem label="Created by" value={tracking.created_by} />
                                <DetailItem label="Last updated" value={formatAccountsDate(tracking.updated_date)} />
                                <DetailItem label="Last updated by" value={tracking.updated_by} />
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

export default AccountsViewModal;
