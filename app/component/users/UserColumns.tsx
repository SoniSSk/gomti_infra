import React from "react";
import { Pencil } from "lucide-react";

import {
    USER_ROLE_LABELS,
    isUserActive,
    toUserRole,
    type UserObject,
} from "@/app/types/user";
import type { ExportColumn } from "@/app/utils/tableExport";
import { TableColumn } from "../vehicle_new/common/CommonTable";
import CommonButton from "../vehicle_new/common/CommonButton";
import { formatDateTime } from "../vehicle_new/common/dateTime";

/* =========================================================
   HELPERS
========================================================= */

const formatUserDate = (value?: Date | string | null): string =>
    value
        ? formatDateTime(value instanceof Date ? value.toISOString() : value)
        : "";

/** Stored role -> "Super Admin"; unknown roles are shown as stored. */
export const formatUserRole = (role?: string): string =>
    USER_ROLE_LABELS[toUserRole(role)] ?? role ?? "";

const ROLE_BADGE_CLASS: Record<string, string> = {
    superadmin: "bg-orange-50 text-orange-700 ring-orange-200",
    admin: "bg-blue-50 text-blue-700 ring-blue-200",
    employee: "bg-green-50 text-green-700 ring-green-200",
    lab: "bg-purple-50 text-purple-700 ring-purple-200",
};

export const UserRoleBadge = ({ role }: { role?: string }) => (
    <span
        className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_BADGE_CLASS[toUserRole(role)] ??
            "bg-gray-50 text-gray-700 ring-gray-200"
            }`}
    >
        {formatUserRole(role) || "—"}
    </span>
);

/* On/off switch; the label says what the current state is. */
const ActiveToggle = ({
    active,
    disabled,
    busy,
    onChange,
}: {
    active: boolean;
    disabled?: boolean;
    busy?: boolean;
    onChange?: (active: boolean) => void;
}) => (
    <label
        className={`inline-flex items-center gap-2 whitespace-nowrap ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
        <button
            type="button"
            role="switch"
            aria-checked={active}
            disabled={disabled || busy}
            onClick={(event) => {
                event.stopPropagation();
                onChange?.(!active);
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed ${active ? "bg-green-500" : "bg-gray-300"} ${busy ? "animate-pulse" : ""}`}
        >
            <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`}
            />
        </button>
        <span
            className={`text-xs font-medium ${active ? "text-green-700" : "text-gray-500"}`}
        >
            {active ? "Active" : "Inactive"}
        </span>
    </label>
);

/* =========================================================
   EXPORT COLUMNS
========================================================= */

export const userExportColumns: ExportColumn<UserObject>[] = [
    { label: "Name", value: (row) => row.name },
    { label: "Email", value: (row) => row.email },
    { label: "Role", value: (row) => formatUserRole(row.role) },
    { label: "Buyer", value: (row) => row.buyer },
    { label: "Status", value: (row) => (isUserActive(row.active) ? "Active" : "Inactive") },
    { label: "Last Login", value: (row) => formatUserDate(row.lastLoginAt) },
    { label: "Created At", value: (row) => formatUserDate(row.createdAt) },
    { label: "Updated By", value: (row) => row.updatedBy },
    { label: "Updated At", value: (row) => formatUserDate(row.updatedAt) },
];

/* =========================================================
   COLUMNS
========================================================= */

interface UserColumnActions {
    currentUserId?: string;
    /** Ids whose active toggle is saving. */
    pendingIds?: ReadonlySet<string>;
    onToggleActive?: (user: UserObject, active: boolean) => void;
    onEdit?: (user: UserObject) => void;
}

export const userColumns = ({
    currentUserId,
    pendingIds,
    onToggleActive,
    onEdit,
}: UserColumnActions = {}): TableColumn<UserObject>[] => [
    /* Name + email */
    {
        key: "name",
        label: "User",
        render: (row) => (
            <div className="flex max-w-[200px] flex-col sm:max-w-[280px]">
                <span className="truncate font-semibold text-gray-900">
                    {row.name || "—"}
                    {row.id === currentUserId && (
                        <span className="ml-1.5 text-xs font-normal text-gray-400">
                            (you)
                        </span>
                    )}
                </span>
                <span className="truncate text-xs text-gray-500">
                    {row.email}
                </span>
            </div>
        ),
    },

    {
        key: "role",
        label: "Role",
        render: (row) => (
            <div className="flex flex-col items-start gap-1">
                <UserRoleBadge role={row.role} />
                {row.buyer && (
                    <span
                        className="max-w-[160px] truncate text-xs text-gray-500"
                        title={row.buyer}
                    >
                        {row.buyer}
                    </span>
                )}
            </div>
        ),
    },

    /* A super admin can't deactivate their own account */
    {
        key: "active",
        label: "Status",
        render: (row) => {
            const isSelf = row.id === currentUserId;

            return (
                <span
                    title={isSelf ? "You can't deactivate your own account" : undefined}
                    onClick={(event) => event.stopPropagation()}
                >
                    <ActiveToggle
                        active={isUserActive(row.active)}
                        disabled={isSelf || !onToggleActive}
                        busy={pendingIds?.has(row.id)}
                        onChange={(active) => onToggleActive?.(row, active)}
                    />
                </span>
            );
        },
    },

    {
        key: "lastLoginAt",
        label: "Last Login",
        hideOnMobile: true,
        render: (row) => {
            const lastLogin = formatUserDate(row.lastLoginAt);

            return (
                <div className="flex flex-col whitespace-nowrap tabular-nums">
                    <span className={lastLogin ? "text-gray-900" : "text-gray-300"}>
                        {lastLogin || "Never"}
                    </span>
                    {row.lastLoginDevice && (
                        <span className="text-xs capitalize text-gray-500">
                            {row.lastLoginDevice}
                        </span>
                    )}
                </div>
            );
        },
    },

    {
        key: "createdAt",
        label: "Created",
        hideOnMobile: true,
        render: (row) => {
            const created = formatUserDate(row.createdAt);

            return (
                <span
                    className={`whitespace-nowrap tabular-nums ${created ? "text-gray-900" : "text-gray-300"}`}
                >
                    {created || "—"}
                </span>
            );
        },
    },

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
