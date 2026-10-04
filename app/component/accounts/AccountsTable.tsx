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
import CommonDateRangePicker from "../vehicle_new/common/CommonDateRangePicker";

import {
    OPERATION_CATEGORIES,
    getBookAccounts,
    type AccountBook,
    type BusinessOperation,
    type OperationStatus,
} from "@/app/types/accounts";
import {
    accountsColumns,
    accountsExportColumns,
    operationTypeLabel,
} from "./AccountsColumns";
import AccountsViewModal from "./AccountsViewModal";
import AccountsFormModal from "./AccountsFormModal";
import AccountsStats from "./AccountsStats";

import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";
import { fetchJson } from "@/app/lib/fetchJson";

/* =========================================================
   TYPES
========================================================= */

type DateFilter =
    | "all"
    | "today"
    | "7days"
    | "custom";

interface AccountsTableProps {
    /** Which account book to list; sets the API query and account filter. */
    book: AccountBook;
    apiEndpoint?: string;
    pageSize?: number;
    /** Change this value to force a refetch (e.g. after adding a record). */
    refreshKey?: number;
}

const AUTO_REFRESH_MS = 60_000;

const toOptions = (values: readonly string[]) =>
    values.map((value) => ({ label: value, value }));

const DATE_FILTER: TableFilter = {
    key: "dateFilter",
    label: "Date",
    required: true,
    options: [
        { label: "Today", value: "today" },
        { label: "Last 7 Days", value: "7days" },
        { label: "All Dates", value: "all" },
        { label: "Custom Range", value: "custom" },
    ],
};

const CATEGORY_FILTER: TableFilter = {
    key: "category",
    label: "All Categories",
    options: toOptions(OPERATION_CATEGORIES),
};

/* =========================================================
   HELPERS
========================================================= */

const getToday = (): string => {
    const today = new Date();

    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${today.getFullYear()}-${month}-${day}`;
};

const getRowKey = (row: BusinessOperation): string =>
    (row as BusinessOperation & { _id?: string })._id ?? String(row.sno);

/* =========================================================
   COMPONENT
========================================================= */

export default function AccountsTable({
    book,
    apiEndpoint = "/api/accounts",
    pageSize = 50,
    refreshKey = 0,
}: AccountsTableProps) {
    /* =====================================================
       STATE
    ===================================================== */

    const [operations, setOperations] = useState<BusinessOperation[]>([]);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState<OperationStatus | null>(null);

    const [accountFilter, setAccountFilter] = useState("");

    const [categoryFilter, setCategoryFilter] = useState("");

    const [dateFilter, setDateFilter] = useState<DateFilter>("7days");

    const [customStartDate, setCustomStartDate] = useState(getToday());

    const [customEndDate, setCustomEndDate] = useState(getToday());

    const [openRangePicker, setOpenRangePicker] = useState(false);

    const hasCustomRange =
        Boolean(customStartDate && customEndDate) &&
        customStartDate <= customEndDate;

    /*
     * Latest request id, so a slow response can't
     * overwrite a newer one (e.g. after a filter change).
     */
    const requestIdRef = useRef(0);

    const inFlightRef = useRef(false);

    /* =====================================================
       API URL
    ===================================================== */

    const filters = useMemo<TableFilter[]>(
        () => [
            DATE_FILTER,
            { key: "account", label: "All Accounts", options: toOptions(getBookAccounts(book)) },
            CATEGORY_FILTER,
        ],
        [book],
    );

    const apiUrl = useMemo(() => {
        const params = new URLSearchParams({ book: book.key });

        params.set(
            "dateFilter",
            dateFilter === "7days" ? "last7days" : dateFilter,
        );

        if (dateFilter === "custom") {
            params.set("startDate", customStartDate);
            params.set("endDate", customEndDate);
        }

        return `${apiEndpoint}?${params.toString()}`;
    }, [apiEndpoint, book.key, dateFilter, customStartDate, customEndDate]);

    /* =====================================================
       FETCH

       silent: background refresh. No spinner, no toast,
       and existing rows stay if it fails.
    ===================================================== */

    const load = useCallback(
        async ({
            mode,
            signal,
        }: {
            mode: "initial" | "refresh" | "silent";
            signal?: AbortSignal;
        }) => {
            if (dateFilter === "custom" && !hasCustomRange) {
                return;
            }

            const requestId = ++requestIdRef.current;

            inFlightRef.current = true;

            if (mode === "initial") {
                setLoading(true);
                setError(null);
            } else if (mode === "refresh") {
                setRefreshing(true);
            }

            try {
                const { response, data } = await fetchJson<{
                    operations?: BusinessOperation[];
                }>(apiUrl, {
                    method: "GET",
                    cache: "no-store",
                    signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch accounts");
                }

                if (requestId !== requestIdRef.current) {
                    return;
                }

                setOperations(Array.isArray(data?.operations) ? data.operations : []);
                setError(null);
            } catch (fetchError) {
                if (
                    fetchError instanceof DOMException &&
                    fetchError.name === "AbortError"
                ) {
                    return;
                }

                console.error("Accounts Fetch Error:", fetchError);

                if (mode === "initial") {
                    setOperations([]);
                    setError(
                        "Couldn't load accounts. Check your connection and try again.",
                    );
                } else if (mode === "refresh") {
                    toast.error(
                        "Couldn't refresh accounts. Please try again.",
                    );
                }
            } finally {
                if (requestId === requestIdRef.current) {
                    inFlightRef.current = false;
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [apiUrl, dateFilter, hasCustomRange],
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

    useAutoRefresh(
        () => {
            if (inFlightRef.current) return;

            void load({ mode: "silent" });
        },
        {
            intervalMs: AUTO_REFRESH_MS,
            enabled: !(dateFilter === "custom" && !hasCustomRange),
        },
    );

    /* =====================================================
       FILTER + SEARCH

       Account / category narrow what the stat cards count;
       the status card then narrows the table.
    ===================================================== */

    const filtered = useMemo(
        () =>
            operations.filter(
                (row) =>
                    (!accountFilter || row.account === accountFilter) &&
                    (!categoryFilter || row.type?.category === categoryFilter),
            ),
        [operations, accountFilter, categoryFilter],
    );

    const tableData = useMemo(() => {
        const searchText = search.trim().toLowerCase();

        const byStatus = statusFilter
            ? filtered.filter((row) => row.status?.value === statusFilter)
            : filtered;

        if (!searchText) {
            return byStatus;
        }

        return byStatus.filter((row) =>
            [
                row.tracking?.id,
                row.name,
                row.description,
                row.account,
                row.type?.category,
                operationTypeLabel(row),
                row.status?.value,
                row.status?.reason,
                row.tracking?.reference_no,
                row.tracking?.assigned_to,
                row.tracking?.created_by,
                row.document?.document_name,
                row.document?.document_number,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(searchText),
        );
    }, [filtered, search, statusFilter]);

    /* =====================================================
       VIEW / EDIT
    ===================================================== */

    const [selected, setSelected] = useState<BusinessOperation | null>(null);

    const [modal, setModal] = useState<"view" | "edit" | null>(null);

    const handleView = useCallback((row: BusinessOperation) => {
        setSelected(row);
        setModal("view");
    }, []);

    const handleEdit = useCallback((row: BusinessOperation) => {
        setSelected(row);
        setModal("edit");
    }, []);

    const handleCloseModal = useCallback(() => {
        setModal(null);
        setSelected(null);
    }, []);

    const handleEditSuccess = useCallback(() => {
        handleCloseModal();
        void load({ mode: "silent" });
    }, [handleCloseModal, load]);

    const columns = useMemo(
        () => accountsColumns({ onView: handleView, onEdit: handleEdit }),
        [handleView, handleEdit],
    );

    /* =====================================================
       FILTER CHANGE
    ===================================================== */

    const handleFilterChange = (key: string, value: string) => {
        if (key === "account") {
            setAccountFilter(value);
            return;
        }

        if (key === "category") {
            setCategoryFilter(value);
            return;
        }

        if (key !== "dateFilter") {
            return;
        }

        const nextFilter = value as DateFilter;

        setDateFilter(nextFilter);

        // Open the picker when the user picks
        // "Custom Range", not on first render.
        setOpenRangePicker(nextFilter === "custom");

        if (nextFilter === "custom" && !hasCustomRange) {
            setCustomStartDate(getToday());
            setCustomEndDate(getToday());
        }
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="w-full space-y-6">
            <AccountsStats
                operations={filtered}
                loading={loading}
                error={Boolean(error)}
                activeStatus={statusFilter}
                onStatusChange={setStatusFilter}
            />

            <CommonTable<BusinessOperation>
                columns={columns}
                getRowKey={getRowKey}
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
                searchPlaceholder="Search name, ref, document..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={filters}
                filterValues={{
                    dateFilter,
                    account: accountFilter,
                    category: categoryFilter,
                }}
                onFilterChange={handleFilterChange}
                filterContent={
                    dateFilter === "custom" ? (
                        <CommonDateRangePicker
                            startDate={customStartDate}
                            endDate={customEndDate}
                            defaultOpen={openRangePicker}
                            onChange={(start, end) => {
                                setCustomStartDate(start);
                                setCustomEndDate(end);
                            }}
                        />
                    ) : null
                }
                emptyMessage={
                    statusFilter
                        ? "No entries with this status"
                        : "No accounts entries found"
                }
                pagination
                pageSize={pageSize}
                showTotal={false}
                exportable
                exportFileName={`${book.key}-accounts`}
                exportColumns={accountsExportColumns}
            />

            <AccountsViewModal
                operation={selected}
                isOpen={modal === "view"}
                onClose={handleCloseModal}
                onEdit={() => setModal("edit")}
            />

            <AccountsFormModal
                book={book}
                operation={selected}
                isOpen={modal === "edit"}
                onClose={handleCloseModal}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
}
