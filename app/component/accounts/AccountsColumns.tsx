import React from "react";
import { Eye, Paperclip, Pencil } from "lucide-react";

import { getDocumentFiles, type BusinessOperation } from "@/app/types/accounts";
import type { ExportColumn } from "@/app/utils/tableExport";
import { TableColumn } from "../vehicle_new/common/CommonTable";
import CommonButton from "../vehicle_new/common/CommonButton";
import { formatDateTime } from "../vehicle_new/common/dateTime";
import { OperationStatusBadge, PriorityBadge } from "./accountsStatus";

/* =========================================================
   HELPERS
========================================================= */

/* Dates arrive from the API as ISO strings, but the type allows Date. */
export const formatAccountsDate = (value?: Date | string): string =>
    formatDateTime(value instanceof Date ? value.toISOString() : value);

/* Date only, for document dates. */
export const formatAccountsDay = (value?: Date | string): string => {
    if (!value) return "";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
};

/** "Bill Payment", or the other_reason when the type is Other. */
export const operationTypeLabel = (row: BusinessOperation): string =>
    row.type?.value === "Other" && row.type.other_reason
        ? `Other: ${row.type.other_reason}`
        : row.type?.value ?? "";

/* =========================================================
   EXPORT COLUMNS
========================================================= */

export const accountsExportColumns: ExportColumn<BusinessOperation>[] = [
    { label: "ID", value: (row) => row.tracking?.id },
    { label: "Payment for", value: (row) => row.name },
    { label: "Description", value: (row) => row.description },
    { label: "Account", value: (row) => row.account },
    { label: "Category", value: (row) => row.type?.category },
    { label: "Type", value: (row) => operationTypeLabel(row) },
    { label: "Status", value: (row) => row.status?.value },
    { label: "Status Reason", value: (row) => row.status?.reason },
    { label: "Reference No", value: (row) => row.tracking?.reference_no },
    { label: "Priority", value: (row) => row.tracking?.priority },
    { label: "Assigned To", value: (row) => row.tracking?.assigned_to },
    { label: "Branch", value: (row) => row.tracking?.branch },
    { label: "Document Type", value: (row) => row.document?.type },
    { label: "Document Name", value: (row) => row.document?.document_name },
    { label: "Document Number", value: (row) => row.document?.document_number },
    { label: "Document Date", value: (row) => formatAccountsDay(row.document?.document_date) },
    { label: "Files", value: (row) => getDocumentFiles(row.document).map(({ url }) => url).join("\n") },
    { label: "Remarks", value: (row) => row.document?.remarks },
    { label: "Created By", value: (row) => row.tracking?.created_by },
    { label: "Created At", value: (row) => formatAccountsDate(row.tracking?.created_date) },
    { label: "Updated By", value: (row) => row.tracking?.updated_by },
    { label: "Updated At", value: (row) => formatAccountsDate(row.tracking?.updated_date) },
];

/* =========================================================
   COLUMNS
========================================================= */

interface AccountsColumnActions {
    onView?: (row: BusinessOperation) => void;
    onEdit?: (row: BusinessOperation) => void;
}

export const accountsColumns = ({
    onView,
    onEdit,
}: AccountsColumnActions = {}): TableColumn<BusinessOperation>[] => [
    /* Name + reference */
    {
        key: "name",
        label: "Payment for",
        render: (row) => (
            <div className="flex max-w-[180px] flex-col sm:max-w-[260px]">
                <span className="truncate font-semibold text-gray-900" title={row.name}>
                    {row.name || "-"}
                </span>
                {row.tracking?.reference_no && (
                    <span className="truncate text-xs text-gray-500">
                        Ref{" "}
                        <span className="font-mono text-gray-700">
                            {row.tracking.reference_no}
                        </span>
                    </span>
                )}
            </div>
        ),
    },

    {
        key: "account",
        label: "Account",
        hideOnMobile: true,
        render: (row) => (
            <span className="whitespace-nowrap text-gray-900">
                {row.account || "—"}
            </span>
        ),
    },

    /* Type, with its category underneath */
    {
        key: "type",
        label: "Type",
        render: (row) => (
            <div className="flex max-w-[200px] flex-col">
                <span className="truncate text-gray-900" title={operationTypeLabel(row)}>
                    {operationTypeLabel(row) || "—"}
                </span>
                <span className="text-xs text-gray-500">{row.type?.category}</span>
            </div>
        ),
    },

    {
        key: "status",
        label: "Status",
        render: (row) => (
            <div className="flex flex-col items-start gap-1">
                <OperationStatusBadge status={row.status?.value} />
                {row.status?.reason && (
                    <span
                        className="max-w-[180px] truncate text-xs text-gray-500"
                        title={row.status.reason}
                    >
                        {row.status.reason}
                    </span>
                )}
            </div>
        ),
    },

    /* Assignee + priority */
    {
        key: "assigned_to",
        label: "Assigned",
        hideOnMobile: true,
        render: (row) => (
            <div className="flex flex-col items-start gap-1 whitespace-nowrap">
                <span
                    className={
                        row.tracking?.assigned_to
                            ? "font-semibold text-gray-900"
                            : "text-gray-300"
                    }
                >
                    {row.tracking?.assigned_to || "—"}
                </span>
                <PriorityBadge priority={row.tracking?.priority} />
            </div>
        ),
    },

    /* Document type + whether a file is attached */
    {
        key: "document",
        label: "Document",
        hideOnMobile: true,
        render: (row) => {
            const { type, document_number } = row.document ?? {};
            const fileCount = getDocumentFiles(row.document).length;

            if (!type && !document_number && !fileCount) {
                return <span className="text-gray-300">—</span>;
            }

            return (
                <div className="flex flex-col whitespace-nowrap">
                    <span className="flex items-center gap-1 text-gray-900">
                        {type || "Document"}
                        {fileCount > 0 && (
                            <span
                                className="inline-flex items-center gap-0.5 text-xs tabular-nums text-gray-500"
                                aria-label={`${fileCount} file${fileCount === 1 ? "" : "s"} attached`}
                            >
                                <Paperclip className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                                {fileCount}
                            </span>
                        )}
                    </span>
                    {document_number && (
                        <span className="font-mono text-xs text-gray-500">
                            {document_number}
                        </span>
                    )}
                </div>
            );
        },
    },

    /* Created at + by */
    {
        key: "created_date",
        label: "Created",
        hideOnMobile: true,
        render: (row) => {
            const created = formatAccountsDate(row.tracking?.created_date);

            return (
                <div className="flex flex-col whitespace-nowrap">
                    <span
                        className={`tabular-nums ${created ? "text-gray-900" : "text-gray-300"}`}
                    >
                        {created || "—"}
                    </span>
                    {row.tracking?.created_by && (
                        <span className="text-[11px] leading-4 text-gray-400">
                            by {row.tracking.created_by}
                        </span>
                    )}
                </div>
            );
        },
    },

    /* View / Edit, same as the lab table */
    {
        key: "action",
        label: "Actions",
        align: "right",
        render: (row) => (
            <div
                className="flex items-center justify-end gap-1.5"
                onClick={(event) => {
                    event.stopPropagation();
                }}
            >
                {onView && (
                    <CommonButton
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        aria-label="View"
                        title="View"
                        onClick={(event) => {
                            event.stopPropagation();
                            onView(row);
                        }}
                    >
                        {/* Icon-only on phones to keep the row narrow */}
                        <span className="hidden sm:inline">View</span>
                    </CommonButton>
                )}

                {onEdit && (
                    <CommonButton
                        variant="secondary"
                        size="sm"
                        icon={Pencil}
                        aria-label="Edit"
                        title="Edit"
                        onClick={(event) => {
                            event.stopPropagation();
                            onEdit(row);
                        }}
                    >
                        <span className="hidden sm:inline">Edit</span>
                    </CommonButton>
                )}
            </div>
        ),
    },
];
