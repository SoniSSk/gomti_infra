/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
    useMemo,
    useState,
} from "react";
import CommonModal from "./CommonModal";

/* =========================================================
   TYPES
========================================================= */

export interface TableColumn<T> {
    key: keyof T | string;
    label: string;

    /**
     * Optional custom cell renderer
     */
    render?: (row: T) => React.ReactNode;

    /**
     * Fixed column width
     * Example: "120px", "180px", "200px"
     */
    width?: string;

    /**
     * Hide column on smaller screens
     */
    hideOnMobile?: boolean;
}

export interface TableFilterOption {
    label: string;
    value: string;
}

export interface TableFilter {
    key: string;
    label: string;
    options: TableFilterOption[];
}

export interface CommonTableProps<T> {
    columns: TableColumn<T>[];

    data: T[];

    loading?: boolean;

    /** When set, the body shows this error with a Retry button. */
    error?: string | null;

    onRetry?: () => void;

    /* =====================================================
       SEARCH
    ===================================================== */

    searchable?: boolean;

    searchPlaceholder?: string;

    searchKeys?: (keyof T)[];

    /* =====================================================
       FILTERS
    ===================================================== */

    filters?: TableFilter[];

    /**
     * Controlled filter values
     */
    filterValues?: Record<string, string>;

    /**
     * Called when filter changes.
     * Useful for server/API filtering.
     */
    onFilterChange?: (
        key: string,
        value: string,
    ) => void;

    /* =====================================================
       EXTERNAL SEARCH
    ===================================================== */

    searchValue?: string;

    onSearchChange?: (
        value: string,
    ) => void;

    /* =====================================================
       ROW
    ===================================================== */

    onRowClick?: (
        row: T,
    ) => void;

    /* =====================================================
       ROW MODAL
    ===================================================== */

    /**
     * Automatically open modal when row is clicked.
     */
    rowModal?: boolean;

    /**
     * Modal title
     */
    rowModalTitle?: string;

    /**
     * Custom modal content.
     */
    rowModalContent?: (
        row: T,
        onClose: () => void,
    ) => React.ReactNode;

    /* =====================================================
       EMPTY
    ===================================================== */

    emptyMessage?: string;

    /* =====================================================
       PAGINATION
    ===================================================== */

    pageSize?: number;

    pageSizeOptions?: number[];

    pagination?: boolean;

    /* =====================================================
       HEADER
    ===================================================== */

    headerContent?: React.ReactNode;

    /* =====================================================
       ADD BUTTON
    ===================================================== */

    onAdd?: () => void;

    addButtonLabel?: string;

    adding?: boolean;

    /* =====================================================
       EXPANDABLE ROW
    ===================================================== */

    expandable?: boolean;

    expandedRowRender?: (
        row: T,
    ) => React.ReactNode;

    /* =====================================================
       REFRESH
    ===================================================== */

    onRefresh?: () =>
        | void
        | Promise<void>;

    refreshing?: boolean;
}

/* =========================================================
   DATE FORMATTER
========================================================= */

const SKELETON_ROWS = 6;

const formatDateTime = (
    value: unknown,
): string => {
    if (!value) {
        return "-";
    }

    const date = new Date(
        String(value),
    );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return String(value);
    }

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        },
    ).format(date);
};

/* =========================================================
   WEIGHT HELPERS
========================================================= */

const parseWeight = (
    value: unknown,
): number => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    if (typeof value === "number") {
        return Number.isFinite(value)
            ? value
            : 0;
    }

    const cleaned = String(value)
        .replace(/,/g, "")
        .trim();

    /*
     * Supports values such as:
     * 30
     * "30"
     * "30 MT"
     * "30.50 MT"
     * "30,500"
     */
    const match = cleaned.match(
        /-?\d+(?:\.\d+)?/,
    );

    if (!match) {
        return 0;
    }

    const parsed = Number(match[0]);

    return Number.isFinite(parsed)
        ? parsed
        : 0;
};

const formatWeight = (
    value: number,
): string => {
    return value.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
        },
    );
};

/* =========================================================
   COMPONENT
========================================================= */

const CommonTable = <
    T extends Record<string, any>
>({
    columns,
    data,

    loading = false,

    error = null,
    onRetry,

    searchable = true,
    searchPlaceholder = "Search...",
    searchKeys,

    filters = [],

    filterValues,
    onFilterChange,

    searchValue,
    onSearchChange,

    onRowClick,

    rowModal = false,
    rowModalTitle = "Details",
    rowModalContent,

    emptyMessage = "No records found",

    pageSize = 10,
    pageSizeOptions = [
        10,
        25,
        50,
        100,
    ],

    pagination = false,

    headerContent,

    onAdd,
    addButtonLabel = "Add Vehicle",
    adding = false,

    expandable = false,
    expandedRowRender,

    onRefresh,
    refreshing = false,
}: CommonTableProps<T>) => {
    /* =====================================================
       STATE
    ===================================================== */

    const [
        internalSearch,
        setInternalSearch,
    ] = useState("");

    const [
        activeFilters,
        setActiveFilters,
    ] = useState<
        Record<string, string>
    >({});

    const [
        currentPage,
        setCurrentPage,
    ] = useState(1);

    const [
        rowsPerPage,
        setRowsPerPage,
    ] = useState(pageSize);

    const [
        expandedRowIndex,
        setExpandedRowIndex,
    ] = useState<number | null>(
        null,
    );

    /**
     * Selected row for modal
     */
    const [
        selectedRow,
        setSelectedRow,
    ] = useState<T | null>(null);

    /* =====================================================
       SEARCH VALUE
    ===================================================== */

    const searchText =
        searchValue !== undefined
            ? searchValue
            : internalSearch;

    /* =====================================================
       SEARCH HANDLER
    ===================================================== */

    const handleSearchChange = (
        value: string,
    ) => {
        if (onSearchChange) {
            onSearchChange(value);
        } else {
            setInternalSearch(value);
        }

        setCurrentPage(1);
        setExpandedRowIndex(null);
    };

    /* =====================================================
       FILTER HANDLER
    ===================================================== */

    const handleFilterChange = (
        key: string,
        value: string,
    ) => {
        /*
         * If parent provides onFilterChange,
         * use server/API filtering.
         */
        if (onFilterChange) {
            onFilterChange(
                key,
                value,
            );
        } else {
            /*
             * Otherwise use local filtering.
             */
            setActiveFilters(
                (previous) => ({
                    ...previous,
                    [key]: value,
                }),
            );
        }

        setCurrentPage(1);
        setExpandedRowIndex(null);
    };

    /* =====================================================
       ROWS PER PAGE
    ===================================================== */

    const handleRowsPerPageChange = (
        value: number,
    ) => {
        setRowsPerPage(value);
        setCurrentPage(1);
        setExpandedRowIndex(null);
    };

    /* =====================================================
       EXPAND ROW
    ===================================================== */

    const handleExpandRow = (
        index: number,
    ) => {
        setExpandedRowIndex(
            (previous) =>
                previous === index
                    ? null
                    : index,
        );
    };

    /* =====================================================
       ROW CLICK
    ===================================================== */

    const handleRowClick = (
        row: T,
    ) => {
        /*
         * Keep existing callback.
         */
        onRowClick?.(row);

        /*
         * Open modal.
         */
        if (rowModal) {
            setSelectedRow(row);
        }
    };

    /* =====================================================
       CLOSE ROW MODAL
    ===================================================== */

    const handleCloseModal = () => {
        setSelectedRow(null);
    };

    /* =====================================================
       FILTER DATA
    ===================================================== */

    const filteredData =
        useMemo(() => {
            let result = [
                ...data,
            ];

            /* ================= SEARCH ================= */

            const search =
                searchText
                    .trim()
                    .toLowerCase();

            if (search) {
                result =
                    result.filter(
                        (row) => {
                            let values: any[];

                            if (
                                searchKeys?.length
                            ) {
                                values =
                                    searchKeys.map(
                                        (
                                            key,
                                        ) =>
                                            row[
                                            key
                                            ],
                                    );
                            } else {
                                values =
                                    Object.values(
                                        row,
                                    );
                            }

                            return values.some(
                                (
                                    value,
                                ) =>
                                    String(
                                        value ??
                                        "",
                                    )
                                        .toLowerCase()
                                        .includes(
                                            search,
                                        ),
                            );
                        },
                    );
            }

            /* ================= LOCAL FILTERS ================= */

            /*
             * Only apply local filters when
             * parent has NOT supplied onFilterChange.
             */
            if (!onFilterChange) {
                Object.entries(
                    activeFilters,
                ).forEach(
                    ([
                        key,
                        value,
                    ]) => {
                        if (!value) {
                            return;
                        }

                        result =
                            result.filter(
                                (
                                    row,
                                ) => {
                                    return String(
                                        row[
                                        key
                                        ] ??
                                        "",
                                    )
                                        .toLowerCase()
                                        .includes(
                                            value.toLowerCase(),
                                        );
                                },
                            );
                    },
                );
            }

            return result;
        }, [
            data,
            searchText,
            searchKeys,
            activeFilters,
            onFilterChange,
        ]);

    /* =====================================================
       PAGINATION
    ===================================================== */

    const totalPages =
        Math.ceil(
            filteredData.length /
            rowsPerPage,
        );

    const paginatedData =
        useMemo(() => {
            if (!pagination) {
                return filteredData;
            }

            const start =
                (currentPage - 1) *
                rowsPerPage;

            const end =
                start +
                rowsPerPage;

            return filteredData.slice(
                start,
                end,
            );
        }, [
            filteredData,
            pagination,
            currentPage,
            rowsPerPage,
        ]);

    /* =====================================================
       TOTAL WEIGHT
    ===================================================== */

    /*
     * Total is calculated from filteredData, not paginatedData,
     * so pagination does not change the total.
     */
    const totalWeight = useMemo(() => {
        return filteredData.reduce(
            (total, row) => {
                return (
                    total +
                    parseWeight(
                        row[
                        "netWeight" as keyof T
                        ],
                    )
                );
            },
            0,
        );
    }, [filteredData]);


    /* =====================================================
       CLEAR FILTERS
    ===================================================== */

    const clearFilters = () => {
        handleSearchChange("");

        if (onFilterChange) {
            filters.forEach(
                (filter) => {
                    onFilterChange(
                        filter.key,
                        "",
                    );
                },
            );
        } else {
            setActiveFilters({});
        }

        setCurrentPage(1);
        setExpandedRowIndex(null);
    };

    /* =====================================================
       ACTIVE FILTER CHECK
    ===================================================== */

    const hasActiveFilters =
        Boolean(searchText) ||
        (onFilterChange
            ? Object.values(
                filterValues ?? {},
            ).some(Boolean)
            : Object.values(
                activeFilters,
            ).some(Boolean));

    /* =====================================================
       REFRESH HANDLER
    ===================================================== */

    const handleRefresh =
        async () => {
            if (
                !onRefresh ||
                refreshing
            ) {
                return;
            }

            try {
                await onRefresh();

                setExpandedRowIndex(
                    null,
                );
            } catch (error) {
                console.error(
                    "Refresh failed:",
                    error,
                );
            }
        };

    /* =====================================================
       ADD HANDLER
    ===================================================== */

    const handleAdd = () => {
        if (
            !onAdd ||
            adding
        ) {
            return;
        }

        onAdd();
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* =================================================
                TOOLBAR
            ================================================= */}

            {(
                searchable ||
                filters.length > 0 ||
                headerContent ||
                onRefresh ||
                onAdd
            ) && (
                    <div className="w-full border-b border-orange-100 bg-white">
                        <div className="w-full p-3 sm:p-4">
                            <div className="flex w-full flex-col gap-3">
                                <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
                                    {/* ================= LEFT ================= */}

                                    <div className="flex min-w-0 w-full flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap">
                                        {/* ================= SEARCH ================= */}

                                        {searchable && (
                                            <div className="relative w-full min-w-0 sm:flex-1 lg:max-w-md">
                                                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={
                                                            1.8
                                                        }
                                                        stroke="currentColor"
                                                        className="h-4 w-4"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                                                        />
                                                    </svg>
                                                </div>

                                                <input
                                                    type="text"
                                                    value={
                                                        searchText
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        handleSearchChange(
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    placeholder={
                                                        searchPlaceholder
                                                    }
                                                    className="
                                                    h-10
                                                    w-full
                                                    min-w-0
                                                    rounded-lg
                                                    border
                                                    border-gray-300
                                                    bg-white
                                                    pl-9
                                                    pr-9
                                                    text-sm
                                                    text-gray-700
                                                    outline-none
                                                    transition
                                                    placeholder:text-gray-400
                                                    hover:border-orange-300
                                                    focus:border-orange-500
                                                    focus:ring-2
                                                    focus:ring-orange-100
                                                "
                                                />

                                                {searchText && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleSearchChange(
                                                                "",
                                                            )
                                                        }
                                                        className="
                                                        absolute
                                                        right-2
                                                        top-1/2
                                                        -translate-y-1/2
                                                        rounded-md
                                                        p-1
                                                        text-gray-400
                                                        transition
                                                        hover:bg-orange-50
                                                        hover:text-orange-500
                                                    "
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* ================= FILTERS ================= */}

                                        {filters.map(
                                            (
                                                filter,
                                            ) => (
                                                <select
                                                    key={
                                                        filter.key
                                                    }
                                                    value={
                                                        filterValues?.[
                                                        filter
                                                            .key
                                                        ] ??
                                                        activeFilters[
                                                        filter
                                                            .key
                                                        ] ??
                                                        ""
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        handleFilterChange(
                                                            filter.key,
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    className="
                                                    h-10
                                                    w-full
                                                    min-w-0
                                                    cursor-pointer
                                                    rounded-lg
                                                    border
                                                    border-gray-300
                                                    bg-white
                                                    px-3
                                                    text-sm
                                                    font-medium
                                                    text-gray-700
                                                    outline-none
                                                    transition
                                                    hover:border-orange-400
                                                    focus:border-orange-500
                                                    focus:ring-2
                                                    focus:ring-orange-100
                                                    sm:w-auto
                                                    sm:min-w-[160px]
                                                    sm:flex-1
                                                    lg:flex-none
                                                "
                                                >
                                                    <option value="">
                                                        {
                                                            filter.label
                                                        }
                                                    </option>

                                                    {filter.options.map(
                                                        (
                                                            option,
                                                        ) => (
                                                            <option
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {
                                                                    option.label
                                                                }
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            ),
                                        )}

                                        {/* ================= CLEAR ================= */}

                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={
                                                    clearFilters
                                                }
                                                className="
                                                h-10
                                                w-full
                                                rounded-lg
                                                border
                                                border-gray-200
                                                bg-gray-50
                                                px-3
                                                text-sm
                                                font-medium
                                                text-gray-600
                                                transition
                                                hover:border-orange-200
                                                hover:bg-orange-50
                                                hover:text-orange-600
                                                sm:w-auto
                                            "
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    {/* ================= RIGHT ACTIONS ================= */}

                                    <div
                                        className="
                                        flex
                                        w-full
                                        flex-col
                                        gap-2
                                        sm:flex-row
                                        sm:items-center
                                        lg:w-auto
                                        lg:flex-shrink-0
                                    "
                                    >
                                        {/* ================= HEADER CONTENT ================= */}

                                        {headerContent && (
                                            <div
                                                className="
                                                flex
                                                w-full
                                                sm:w-[160px]
                                                md:w-[160px]
                                                lg:w-auto
                                            "
                                            >
                                                {
                                                    headerContent
                                                }
                                            </div>
                                        )}

                                        {/* ================= ADD ================= */}

                                        {onAdd && (
                                            <button
                                                type="button"
                                                onClick={
                                                    handleAdd
                                                }
                                                disabled={
                                                    adding ||
                                                    loading
                                                }
                                                className="
                                                inline-flex
                                                h-10
                                                w-full
                                                items-center
                                                justify-center
                                                gap-2
                                                rounded-lg
                                                bg-orange-500
                                                px-4
                                                text-sm
                                                font-semibold
                                                text-white
                                                shadow-sm
                                                transition-all
                                                duration-200
                                                hover:bg-orange-600
                                                active:scale-[0.98]
                                                disabled:cursor-not-allowed
                                                disabled:opacity-50
                                                sm:w-[160px]
                                                md:w-[160px]
                                                lg:w-auto
                                            "
                                            >
                                                {adding ? (
                                                    <>
                                                        <svg
                                                            className="h-4 w-4 animate-spin"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />

                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                                            />
                                                        </svg>

                                                        <span>
                                                            Adding...
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={
                                                                2
                                                            }
                                                            stroke="currentColor"
                                                            className="h-5 w-5"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M12 4v16m8-8H4"
                                                            />
                                                        </svg>

                                                        <span className="whitespace-nowrap">
                                                            {
                                                                addButtonLabel
                                                            }
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {/* ================= REFRESH ================= */}

                                        {onRefresh && (
                                            <button
                                                type="button"
                                                onClick={
                                                    handleRefresh
                                                }
                                                disabled={
                                                    refreshing ||
                                                    loading
                                                }
                                                title="Refresh"
                                                className="
                                                inline-flex
                                                h-10
                                                w-full
                                                items-center
                                                justify-center
                                                gap-2
                                                rounded-lg
                                                border
                                                border-gray-200
                                                bg-white
                                                px-4
                                                text-sm
                                                font-semibold
                                                text-gray-600
                                                shadow-sm
                                                transition-all
                                                duration-200
                                                hover:border-orange-300
                                                hover:bg-orange-50
                                                hover:text-orange-600
                                                active:scale-[0.98]
                                                disabled:cursor-not-allowed
                                                disabled:opacity-50
                                                sm:w-[160px]
                                                md:w-[160px]
                                                lg:w-auto
                                            "
                                            >
                                                {refreshing ? (
                                                    <>
                                                        <svg
                                                            className="h-4 w-4 animate-spin"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />

                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                                            />
                                                        </svg>

                                                        <span>
                                                            Refreshing...
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={
                                                                2
                                                            }
                                                            stroke="currentColor"
                                                            className="h-4 w-4"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M4.5 12a7.5 7.5 0 0112.8-5.3L19.5 9"
                                                            />

                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19.5 4.5V9h-4.5"
                                                            />

                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19.5 12a7.5 7.5 0 01-12.8 5.3L4.5 15"
                                                            />

                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M4.5 19.5V15H9"
                                                            />
                                                        </svg>

                                                        <span>
                                                            Refresh
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {/* =================================================
                TABLE
            ================================================= */}

            <div
                className="
                    w-full
                    overflow-x-auto
                    overflow-y-visible
                    overscroll-x-contain
                "
            >
                <table
                    className="
                        min-w-max
                        w-full
                        border-collapse
                        whitespace-nowrap
                    "
                >
                    {/* ================= HEAD ================= */}

                    <thead>
                        <tr className="border-b border-orange-600 bg-orange-500">
                            {/* EXPAND COLUMN */}

                            {expandable && (
                                <th
                                    className="
                                        sticky
                                        top-0
                                        z-20
                                        w-[52px]
                                        min-w-[52px]
                                        max-w-[52px]
                                        bg-orange-500
                                        px-2
                                        py-3
                                    "
                                    style={{
                                        width: "52px",
                                        minWidth: "52px",
                                        maxWidth: "52px",
                                    }}
                                />
                            )}

                            {/* NORMAL COLUMNS */}

                            {columns.map(
                                (
                                    column,
                                ) => (
                                    <th
                                        key={String(
                                            column.key,
                                        )}
                                        style={{
                                            width:
                                                column.width,
                                            minWidth:
                                                column.width,
                                            maxWidth:
                                                column.width,
                                        }}
                                        className={`
                                            sticky
                                            top-0
                                            z-20
                                            whitespace-nowrap
                                            bg-orange-500
                                            px-4
                                            py-3
                                            text-left
                                            text-xs
                                            font-bold
                                            uppercase
                                            tracking-wider
                                            text-white
                                            ${column.hideOnMobile
                                                ? "hidden sm:table-cell"
                                                : ""
                                            }
                                        `}
                                    >
                                        {
                                            column.label
                                        }
                                    </th>
                                ),
                            )}
                        </tr>
                    </thead>

                    {/* ================= BODY ================= */}

                    <tbody
                        className="divide-y divide-gray-100"
                        aria-busy={loading}
                    >
                        {loading ? (
                            Array.from(
                                { length: SKELETON_ROWS },
                                (_, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        className="animate-pulse"
                                    >
                                        {expandable && (
                                            <td className="px-2 py-3" />
                                        )}

                                        {columns.map(
                                            (_, colIndex) => (
                                                <td
                                                    key={colIndex}
                                                    className="px-4 py-3"
                                                >
                                                    <div
                                                        className="h-3.5 rounded bg-gray-200"
                                                        style={{
                                                            width: `${55 + ((rowIndex + colIndex) % 4) * 12}%`,
                                                        }}
                                                    />
                                                </td>
                                            ),
                                        )}
                                    </tr>
                                ),
                            )
                        ) : error ? (
                            <tr>
                                <td
                                    colSpan={
                                        columns.length +
                                        (expandable
                                            ? 1
                                            : 0)
                                    }
                                    className="px-4 py-16 text-center"
                                >
                                    <div
                                        role="alert"
                                        className="flex flex-col items-center justify-center"
                                    >
                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="h-6 w-6"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                                />
                                            </svg>
                                        </div>

                                        <p className="text-sm font-semibold text-gray-700">
                                            {error}
                                        </p>

                                        {onRetry && (
                                            <button
                                                type="button"
                                                onClick={onRetry}
                                                disabled={refreshing}
                                                className="mt-3 inline-flex h-9 cursor-pointer items-center rounded-lg bg-orange-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {refreshing
                                                    ? "Retrying..."
                                                    : "Retry"}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedData.length ===
                            0 ? (
                            <tr>
                                <td
                                    colSpan={
                                        columns.length +
                                        (expandable
                                            ? 1
                                            : 0)
                                    }
                                    className="px-4 py-16 text-center"
                                >
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-400">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={
                                                    1.5
                                                }
                                                stroke="currentColor"
                                                className="h-6 w-6"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M20.25 6.75v10.5a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6.75m16.5 0A2.25 2.25 0 0018 4.5H6a2.25 2.25 0 00-2.25 2.25m16.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0l-7.5-4.615A2.25 2.25 0 013.75 6.993V6.75"
                                                />
                                            </svg>
                                        </div>

                                        <p className="text-sm font-semibold text-gray-700">
                                            {
                                                emptyMessage
                                            }
                                        </p>

                                        {hasActiveFilters && (
                                            <p className="mt-1 text-xs text-gray-400">
                                                Try
                                                changing
                                                your
                                                search
                                                or
                                                filters.
                                            </p>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map(
                                (
                                    row,
                                    rowIndex,
                                ) => {
                                    const isExpanded =
                                        expandedRowIndex ===
                                        rowIndex;

                                    return (
                                        <React.Fragment
                                            key={
                                                rowIndex
                                            }
                                        >
                                            {/* ================= MAIN ROW ================= */}

                                            <tr
                                                onClick={() =>
                                                    handleRowClick(
                                                        row,
                                                    )
                                                }
                                                className={`
                                                    group
                                                    border-b
                                                    border-gray-100
                                                    transition-colors
                                                    duration-150
                                                    ${onRowClick ||
                                                        rowModal
                                                        ? "cursor-pointer hover:bg-orange-50"
                                                        : "hover:bg-gray-50"
                                                    }
                                                `}
                                            >
                                                {/* ================= EXPAND ================= */}

                                                {expandable && (
                                                    <td
                                                        className="
                                                            w-[52px]
                                                            min-w-[52px]
                                                            max-w-[52px]
                                                            px-2
                                                            py-3
                                                            text-center
                                                        "
                                                        style={{
                                                            width: "52px",
                                                            minWidth:
                                                                "52px",
                                                            maxWidth:
                                                                "52px",
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();

                                                                handleExpandRow(
                                                                    rowIndex,
                                                                );
                                                            }}
                                                            title={
                                                                isExpanded
                                                                    ? "Hide details"
                                                                    : "Show details"
                                                            }
                                                            className="
                                                                inline-flex
                                                                h-8
                                                                w-8
                                                                cursor-pointer
                                                                items-center
                                                                justify-center
                                                                rounded-lg
                                                                border
                                                                border-gray-200
                                                                bg-white
                                                                text-gray-500
                                                                shadow-sm
                                                                transition
                                                                hover:border-orange-300
                                                                hover:bg-orange-50
                                                                hover:text-orange-600
                                                            "
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={
                                                                    2
                                                                }
                                                                stroke="currentColor"
                                                                className={`
                                                                    h-4
                                                                    w-4
                                                                    transition-transform
                                                                    duration-200
                                                                    ${isExpanded
                                                                        ? "rotate-180 text-orange-500"
                                                                        : ""
                                                                    }
                                                                `}
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="m19 9-7 7-7-7"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                )}

                                                {/* ================= CELLS ================= */}

                                                {columns.map(
                                                    (
                                                        column,
                                                        columnIndex,
                                                    ) => (
                                                        <td
                                                            key={String(
                                                                column.key,
                                                            )}
                                                            style={{
                                                                width:
                                                                    column.width,
                                                                minWidth:
                                                                    column.width,
                                                                maxWidth:
                                                                    column.width,
                                                            }}
                                                            className={`
                                                                whitespace-nowrap
                                                                overflow-hidden
                                                                text-ellipsis
                                                                px-4
                                                                py-3
                                                                text-sm
                                                                text-gray-700
                                                                ${column.hideOnMobile
                                                                    ? "hidden sm:table-cell"
                                                                    : ""
                                                                }
                                                            `}
                                                        >
                                                            {column.key ===
                                                                "sno"
                                                                ? pagination
                                                                    ? (
                                                                        currentPage -
                                                                        1
                                                                    ) *
                                                                    rowsPerPage +
                                                                    rowIndex +
                                                                    1
                                                                    : rowIndex +
                                                                    1
                                                                : column.render
                                                                    ? column.render(
                                                                        row,
                                                                    )
                                                                    : (() => {
                                                                        const value =
                                                                            row[
                                                                            column.key as keyof T
                                                                            ];

                                                                        if (
                                                                            column.key ===
                                                                            "createdAt" ||
                                                                            column.key ===
                                                                            "updatedAt" ||
                                                                            column.key ===
                                                                            "dateTime" ||
                                                                            column.key ===
                                                                            "inTime" ||
                                                                            column.key ===
                                                                            "outTime"
                                                                        ) {
                                                                            return formatDateTime(
                                                                                value,
                                                                            );
                                                                        }

                                                                        return String(
                                                                            value ??
                                                                            "-",
                                                                        );
                                                                    })()}
                                                        </td>
                                                    ),
                                                )}
                                            </tr>

                                            {/* ================= EXPANDED ROW ================= */}

                                            {expandable &&
                                                isExpanded &&
                                                expandedRowRender && (
                                                    <tr>
                                                        <td
                                                            colSpan={
                                                                columns.length +
                                                                1
                                                            }
                                                            className="bg-orange-50/40 p-0"
                                                        >
                                                            <div className="border-t border-orange-100">
                                                                {expandedRowRender(
                                                                    row,
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                        </React.Fragment>
                                    );
                                },
                            )
                        )}
                    </tbody>

                    {/* =================================================
                        TOTAL WEIGHT ROW
                    ================================================= */}

                    {!loading && !error && (
                    <tfoot>
                        <tr className="border-t-2 border-orange-200 bg-orange-50">
                            {expandable && (
                                <td
                                    className="
                                        w-[52px]
                                        min-w-[52px]
                                        max-w-[52px]
                                        px-2
                                        py-3
                                    "
                                    style={{
                                        width: "52px",
                                        minWidth: "52px",
                                        maxWidth: "52px",
                                    }}
                                />
                            )}

                            {columns.map(
                                (column, columnIndex) => (
                                    <td
                                        key={`total-${String(
                                            column.key,
                                        )}`}
                                        style={{
                                            width:
                                                column.width,
                                            minWidth:
                                                column.width,
                                            maxWidth:
                                                column.width,
                                        }}
                                        className={`
                                            px-4
                                            py-3
                                            text-left
                                            text-sm
                                            font-bold
                                            text-gray-800
                                            ${column.hideOnMobile
                                                ? "hidden sm:table-cell"
                                                : ""
                                            }
                                        `}
                                    >
                                        {columnIndex === 0 &&
                                            column.key === "sno" ? (
                                            <span>
                                                Total
                                            </span>
                                        ) : column.key ===
                                            "netWeight" ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-orange-700">
                                                    {formatWeight(
                                                        totalWeight,
                                                    )}
                                                </span>

                                                <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-bold text-white">
                                                    MT
                                                </span>
                                            </div>
                                        ) : (
                                            columnIndex === 0 ? (
                                                <span>
                                                    Total
                                                </span>
                                            ) : null
                                        )}
                                    </td>
                                ),
                            )}
                        </tr>
                    </tfoot>
                    )}

                </table>
            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            {pagination && !loading && !error && (
                <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* ================= LEFT ================= */}

                    <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm text-gray-500">
                            Showing{" "}
                            <span className="font-semibold text-gray-800">
                                {filteredData.length ===
                                    0
                                    ? 0
                                    : (currentPage -
                                        1) *
                                    rowsPerPage +
                                    1}
                            </span>{" "}
                            -{" "}
                            <span className="font-semibold text-gray-800">
                                {Math.min(
                                    currentPage *
                                    rowsPerPage,
                                    filteredData.length,
                                )}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-gray-800">
                                {
                                    filteredData.length
                                }
                            </span>
                        </p>

                        {/* ROWS */}

                        <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap text-sm text-gray-500">
                                Rows:
                            </span>

                            <select
                                value={
                                    rowsPerPage
                                }
                                onChange={(
                                    event,
                                ) =>
                                    handleRowsPerPageChange(
                                        Number(
                                            event
                                                .target
                                                .value,
                                        ),
                                    )
                                }
                                className="
                                    h-9
                                    min-w-[70px]
                                    cursor-pointer
                                    rounded-lg
                                    border
                                    border-gray-200
                                    bg-white
                                    px-2
                                    text-sm
                                    font-medium
                                    text-gray-700
                                    outline-none
                                    transition
                                    hover:border-orange-300
                                    focus:border-orange-500
                                    focus:ring-2
                                    focus:ring-orange-100
                                "
                            >
                                {pageSizeOptions.map(
                                    (
                                        size,
                                    ) => (
                                        <option
                                            key={
                                                size
                                            }
                                            value={
                                                size
                                            }
                                        >
                                            {size}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>
                    </div>

                    {/* ================= RIGHT ================= */}

                    <div className="flex flex-wrap items-center gap-1">
                        {/* PREVIOUS */}

                        <button
                            type="button"
                            disabled={
                                currentPage ===
                                1
                            }
                            onClick={() => {
                                setCurrentPage(
                                    (
                                        page,
                                    ) =>
                                        Math.max(
                                            1,
                                            page -
                                            1,
                                        ),
                                );

                                setExpandedRowIndex(
                                    null,
                                );
                            }}
                            className="
                                cursor-pointer
                                rounded-lg
                                border
                                border-gray-200
                                bg-white
                                px-3
                                py-1.5
                                text-sm
                                font-medium
                                text-gray-600
                                transition
                                hover:border-orange-300
                                hover:bg-orange-50
                                hover:text-orange-600
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                            "
                        >
                            Previous
                        </button>

                        {/* PAGE NUMBERS */}

                        {totalPages >
                            0 &&
                            Array.from(
                                {
                                    length:
                                        totalPages,
                                },
                                (
                                    _,
                                    index,
                                ) =>
                                    index +
                                    1,
                            ).map(
                                (
                                    page,
                                ) => (
                                    <button
                                        key={
                                            page
                                        }
                                        type="button"
                                        onClick={() => {
                                            setCurrentPage(
                                                page,
                                            );

                                            setExpandedRowIndex(
                                                null,
                                            );
                                        }}
                                        className={`
                                            min-w-8
                                            cursor-pointer
                                            rounded-lg
                                            px-2
                                            py-1.5
                                            text-sm
                                            font-medium
                                            transition
                                            ${currentPage ===
                                                page
                                                ? "bg-orange-500 text-white"
                                                : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                                            }
                                        `}
                                    >
                                        {
                                            page
                                        }
                                    </button>
                                ),
                            )}

                        {/* NEXT */}

                        <button
                            type="button"
                            disabled={
                                currentPage ===
                                totalPages ||
                                totalPages ===
                                0
                            }
                            onClick={() => {
                                setCurrentPage(
                                    (
                                        page,
                                    ) =>
                                        Math.min(
                                            totalPages,
                                            page +
                                            1,
                                        ),
                                );

                                setExpandedRowIndex(
                                    null,
                                );
                            }}
                            className="
                                cursor-pointer
                                rounded-lg
                                border
                                border-gray-200
                                bg-white
                                px-3
                                py-1.5
                                text-sm
                                font-medium
                                text-gray-600
                                transition
                                hover:border-orange-300
                                hover:bg-orange-50
                                hover:text-orange-600
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                            "
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* =================================================
                ROW DETAILS MODAL
            ================================================= */}

            {rowModal &&
                selectedRow && (
                    <CommonModal
                        isOpen={
                            rowModal &&
                            !!selectedRow
                        }
                        onClose={
                            handleCloseModal
                        }
                        title={
                            rowModalTitle
                        }
                        size="xl"
                        closeOnOutsideClick
                        footer={
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={
                                        handleCloseModal
                                    }
                                    className="
                    rounded-lg
                    border
                    border-gray-300
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-gray-700
                    hover:bg-gray-50
                "
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    className="
                    rounded-lg
                    bg-orange-500
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-white
                    hover:bg-orange-600
                "
                                >
                                    Save
                                </button>
                            </div>
                        }
                    >
                        {selectedRow && (
                            <div className="p-4 sm:p-6">
                                {rowModalContent ? (
                                    rowModalContent(
                                        selectedRow,
                                        handleCloseModal,
                                    )
                                ) : (
                                    <pre className="overflow-x-auto rounded-xl bg-gray-50 p-4 text-xs text-gray-700">
                                        {JSON.stringify(
                                            selectedRow,
                                            null,
                                            2,
                                        )}
                                    </pre>
                                )}
                            </div>
                        )}
                    </CommonModal>
                )}
        </div>
    );
};

export default CommonTable;