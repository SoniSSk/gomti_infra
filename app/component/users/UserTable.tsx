"use client";

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";

import CommonTable, {
    TableFilter,
} from "../vehicle_new/common/CommonTable";
import CommonButton from "../vehicle_new/common/CommonButton";

import {
    USER_ROLES,
    isUserActive,
    toUserRole,
    type UserObject,
} from "@/app/types/user";
import { formatUserRole, userColumns, userExportColumns } from "./UserColumns";
import UserFormModal from "./UserFormModal";

import { fetchJson } from "@/app/lib/fetchJson";

interface UserTableProps {
    /** Change this value to force a refetch (e.g. after adding a user). */
    refreshKey?: number;
    currentUserId?: string;
    pageSize?: number;
}

const ROLE_FILTERS: TableFilter[] = [
    {
        key: "role",
        label: "All Roles",
        options: USER_ROLES.map(({ value, label }) => ({ value, label })),
    },
    {
        key: "status",
        label: "All Statuses",
        options: [
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
        ],
    },
];

const getUserKey = (user: UserObject) => user.id;

export default function UserTable({
    refreshKey = 0,
    currentUserId,
    pageSize = 50,
}: UserTableProps) {
    /* =====================================================
       FETCH
    ===================================================== */

    const [users, setUsers] = useState<UserObject[]>([]);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState<string | null>(null);

    /* Latest request id, so a slow response can't overwrite a newer one. */
    const requestIdRef = useRef(0);

    const load = useCallback(
        async ({
            mode,
            signal,
        }: {
            mode: "initial" | "refresh" | "silent";
            signal?: AbortSignal;
        }) => {
            const requestId = ++requestIdRef.current;

            if (mode === "initial") {
                setLoading(true);
                setError(null);
            } else if (mode === "refresh") {
                setRefreshing(true);
            }

            try {
                const { response, data } = await fetchJson<{
                    users?: UserObject[];
                }>("/api/users", {
                    method: "GET",
                    cache: "no-store",
                    signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }

                if (requestId !== requestIdRef.current) {
                    return;
                }

                setUsers(Array.isArray(data?.users) ? data.users : []);
                setError(null);
            } catch (fetchError) {
                if (
                    fetchError instanceof DOMException &&
                    fetchError.name === "AbortError"
                ) {
                    return;
                }

                console.error("Users Fetch Error:", fetchError);

                if (mode === "initial") {
                    setUsers([]);
                    setError(
                        "Couldn't load users. Check your connection and try again.",
                    );
                } else if (mode === "refresh") {
                    toast.error("Couldn't refresh users. Please try again.");
                }
            } finally {
                if (requestId === requestIdRef.current) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [],
    );

    useEffect(() => {
        const controller = new AbortController();

        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load({ mode: "initial", signal: controller.signal });

        return () => controller.abort();
    }, [load, refreshKey]);

    const handleRefresh = useCallback(
        () => load({ mode: "refresh" }),
        [load],
    );

    /* =====================================================
       SEARCH / FILTER
    ===================================================== */

    const [search, setSearch] = useState("");

    const [roleFilter, setRoleFilter] = useState("");

    const [statusFilter, setStatusFilter] = useState("");

    const tableData = useMemo(() => {
        const searchText = search.trim().toLowerCase();

        const byRole = users.filter(
            (user) =>
                (!roleFilter || toUserRole(user.role) === roleFilter) &&
                (!statusFilter ||
                    isUserActive(user.active) === (statusFilter === "active")),
        );

        if (!searchText) {
            return byRole;
        }

        return byRole.filter((user) =>
            [user.name, user.email, formatUserRole(user.role), user.buyer]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(searchText),
        );
    }, [users, search, roleFilter, statusFilter]);

    /* =====================================================
       ACTIVE TOGGLE

       Flipped right away, rolled back if the save fails.
    ===================================================== */

    const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(
        () => new Set(),
    );

    const setUserActive = (id: string, active: boolean) =>
        setUsers((prev) =>
            prev.map((user) => (user.id === id ? { ...user, active } : user)),
        );

    const setPending = (id: string, pending: boolean) =>
        setPendingIds((prev) => {
            const next = new Set(prev);
            if (pending) next.add(id);
            else next.delete(id);
            return next;
        });

    const handleToggleActive = useCallback(
        async (user: UserObject, active: boolean) => {
            setPending(user.id, true);
            setUserActive(user.id, active);

            try {
                const response = await fetch(`/api/users/${user.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ active }),
                });

                const result = await response.json().catch(() => null);

                if (!response.ok || !result?.success) {
                    throw new Error(result?.message || "Failed to update status");
                }

                toast.success(
                    `${user.name || user.email} is now ${active ? "active" : "inactive"}`,
                );
            } catch (toggleError) {
                console.error("Toggle user active error:", toggleError);

                setUserActive(user.id, !active);
                toast.error(
                    toggleError instanceof Error
                        ? toggleError.message
                        : "Failed to update status",
                );
            } finally {
                setPending(user.id, false);
            }
        },
        [],
    );

    /* =====================================================
       EDIT
    ===================================================== */

    const [selectedUser, setSelectedUser] = useState<UserObject | null>(null);

    const [modal, setModal] = useState<"edit" | null>(null);

    const handleEdit = useCallback((user: UserObject) => {
        setSelectedUser(user);
        setModal("edit");
    }, []);

    const handleCloseModal = useCallback(() => {
        setModal(null);
        setSelectedUser(null);
    }, []);

    const handleEditSuccess = useCallback(() => {
        handleCloseModal();
        void load({ mode: "silent" });
    }, [handleCloseModal, load]);

    const columns = useMemo(
        () =>
            userColumns({
                currentUserId,
                pendingIds,
                onToggleActive: handleToggleActive,
                onEdit: handleEdit,
            }),
        [currentUserId, pendingIds, handleToggleActive, handleEdit],
    );

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="w-full space-y-6">
            <CommonTable<UserObject>
                columns={columns}
                getRowKey={getUserKey}
                data={tableData}
                loading={loading}
                error={error}
                onRetry={handleRefresh}
                refreshing={refreshing}
                headerContent={
                    <CommonButton
                        variant="secondary"
                        icon={RefreshCw}
                        onClick={handleRefresh}
                        disabled={loading || refreshing}
                        className={refreshing ? "[&_svg]:animate-spin" : ""}
                    >
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </CommonButton>
                }
                searchable
                searchPlaceholder="Search name or email..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={ROLE_FILTERS}
                filterValues={{ role: roleFilter, status: statusFilter }}
                onFilterChange={(key, value) => {
                    if (key === "role") setRoleFilter(value);
                    if (key === "status") setStatusFilter(value);
                }}
                emptyMessage={
                    roleFilter || statusFilter
                        ? "No users match these filters"
                        : "No users found"
                }
                pagination
                pageSize={pageSize}
                showTotal={false}
                exportable
                exportFileName="users"
                exportColumns={userExportColumns}
            />

            <UserFormModal
                user={selectedUser}
                isOpen={modal === "edit"}
                onClose={handleCloseModal}
                onSuccess={handleEditSuccess}
                currentUserId={currentUserId}
            />
        </div>
    );
}
