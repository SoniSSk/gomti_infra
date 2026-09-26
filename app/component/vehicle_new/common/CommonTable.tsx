/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { ChevronDown, CircleAlert, Download, FileSpreadsheet, FileText, Inbox, Plus, RefreshCw, Search, X } from "lucide-react";
import toast from "react-hot-toast";

import CommonButton from "./CommonButton";
import CommonStateMessage from "./CommonStateMessage";
import CommonModal from "./CommonModal";
import {
    exportTable,
    type ExportColumn,
    type ExportFormat,
} from "@/app/utils/tableExport";

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

    /**
     * Cell alignment. Use "right" for numeric columns.
     */
    align?: "left" | "center" | "right";
}

export interface TableFilterOption {
    label: string;
    value: string;
}

export interface TableFilter {
    key: string;
    label: string;
    options: TableFilterOption[];
    /** Hide the blank "label" option so a value is always selected. */
    required?: boolean;
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

    /**
     * Rendered right after the filter selects, e.g. a
     * date range for a "custom" date filter.
     */
    filterContent?: React.ReactNode;

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

    /** Stable row identity; defaults to the row index. */
    getRowKey?: (
        row: T,
    ) => React.Key;

    /** Extra classes for a row, e.g. to highlight it. */
    rowClassName?: (
        row: T,
    ) => string;

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

    /* =====================================================
       EXPORT
    ===================================================== */

    /**
     * Show the Export (CSV / Excel / PDF) button.
     * Exports every row matching the current search and
     * filters, across all pages.
     */
    exportable?: boolean;

    /** File name without extension. */
    exportFileName?: string;

    /**
     * Columns to export. Defaults to the table columns
     * (minus "action"), using the raw row value.
     */
    exportColumns?: ExportColumn<T>[];
}

const EXPORT_OPTIONS: {
    format: ExportFormat;
    label: string;
    icon: typeof FileText;
}[] = [
    { format: "csv", label: "CSV", icon: FileText },
    { format: "excel", label: "Excel", icon: FileSpreadsheet },
    { format: "pdf", label: "PDF", icon: FileText },
];

/* =========================================================
   DATE FORMATTER
========================================================= */

const SKELETON_ROWS = 6;

const ALIGN_CLASS = {
    left: "text-left",
    center: "text-center",
    right: "text-right tabular-nums",
} as const;

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

export const formatWeight = (
    value: number,
): string => {
    return value.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 3,
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
    filterContent,

    searchValue,
    onSearchChange,

    onRowClick,
    getRowKey,
    rowClassName,

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

    exportable = false,
    exportFileName = "export",
    exportColumns,
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
       EXPORT
    ===================================================== */

    const [
        exportMenuOpen,
        setExportMenuOpen,
    ] = useState(false);

    const [
        exporting,
        setExporting,
    ] = useState(false);

    const exportMenuRef =
        useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!exportMenuOpen) {
            return;
        }

        const handleOutside = (
            event: MouseEvent,
        ) => {
            if (
                !exportMenuRef.current?.contains(
                    event.target as Node,
                )
            ) {
                setExportMenuOpen(false);
            }
        };

        const handleEscape = (
            event: KeyboardEvent,
        ) => {
            if (event.key === "Escape") {
                setExportMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [exportMenuOpen]);

    const handleExport = async (
        format: ExportFormat,
    ) => {
        setExportMenuOpen(false);

        const resolvedColumns: ExportColumn<T>[] =
            exportColumns ??
            columns
                .filter(
                    (column) =>
                        column.key !== "action",
                )
                .map((column) => ({
                    label: column.label,
                    value: (row: T) => {
                        const value =
                            row[column.key as keyof T];

                        return typeof value === "number" ||
                            typeof value === "string"
                            ? value
                            : "";
                    },
                }));

        try {
            setExporting(true);

            await exportTable(format, {
                columns: resolvedColumns,
                rows: filteredData,
                fileName: exportFileName,
            });
        } catch (exportError) {
            console.error("Export failed:", exportError);
            toast.error("Export failed. Please try again.");
        } finally {
            setExporting(false);
        }
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
                filterContent ||
                headerContent ||
                onRefresh ||
                onAdd ||
                exportable
            ) && (
<div className="w-full border-b border-gray-200 bg-white">
                        <div className="w-full p-3 sm:p-4">
                            <div className="flex w-full flex-col gap-3">
                                <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
                                    {/* ================= LEFT ================= */}

                                    <div className="flex min-w-0 w-full flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap">
                                        {/* ================= SEARCH ================= */}

                                        {searchable && (
                                            <div className="relative w-full min-w-0 sm:flex-1 lg:max-w-md">
                                                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                    <Search className="h-4 w-4" aria-hidden="true" />
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
                                                        aria-label="Clear search"
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
                                                        <X className="h-4 w-4" aria-hidden="true" />
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* ================= FILTERS ================= */}

                                        {filters.map(
                                            (
                                                filter,
                                            ) => (
                                                <div
                                                    key={
                                                        filter.key
                                                    }
                                                    className="relative w-full min-w-0 sm:w-auto sm:min-w-[160px] sm:flex-1 lg:flex-none"
                                                >
                                                <select
                                                    aria-label={
                                                        filter.label
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
                                                    appearance-none
                                                    pr-9
                                                "
                                                >
                                                    {!filter.required && (
                                                        <option value="">
                                                            {
                                                                filter.label
                                                            }
                                                        </option>
                                                    )}

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

                                                <ChevronDown
                                                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                                    aria-hidden="true"
                                                />
                                                </div>
                                            ),
                                        )}

                                        {filterContent}
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
sm:w-auto
                                            "
                                            >
                                                {
                                                    headerContent
                                                }
                                            </div>
                                        )}

                                        {/* ================= ADD ================= */}

                                        {onAdd && (
                                            <CommonButton
                                                onClick={handleAdd}
                                                disabled={loading}
                                                loading={adding}
                                                loadingText="Adding..."
                                                icon={Plus}
                                                className="w-full sm:w-auto"
                                            >
                                                {addButtonLabel}
                                            </CommonButton>
                                        )}

                                        {/* ================= EXPORT ================= */}

                                        {exportable && (
                                            <div
                                                ref={exportMenuRef}
                                                className="relative w-full sm:w-auto"
                                            >
                                                <CommonButton
                                                    variant="secondary"
                                                    onClick={() =>
                                                        setExportMenuOpen(
                                                            (open) => !open,
                                                        )
                                                    }
                                                    disabled={
                                                        loading ||
                                                        filteredData.length === 0
                                                    }
                                                    loading={exporting}
                                                    loadingText="Exporting..."
                                                    icon={Download}
                                                    aria-haspopup="menu"
                                                    aria-expanded={exportMenuOpen}
                                                    className="w-full sm:w-auto"
                                                >
                                                    Export
                                                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                                                </CommonButton>

                                                {exportMenuOpen && (
                                                    <div
                                                        role="menu"
                                                        className="absolute right-0 z-50 mt-1 w-full min-w-[160px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg sm:w-auto"
                                                    >
                                                        {EXPORT_OPTIONS.map(
                                                            ({ format, label, icon: Icon }) => (
                                                                <button
                                                                    key={format}
                                                                    type="button"
                                                                    role="menuitem"
                                                                    onClick={() =>
                                                                        handleExport(format)
                                                                    }
                                                                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-orange-50 hover:text-orange-700"
                                                                >
                                                                    <Icon className="h-4 w-4" aria-hidden="true" />
                                                                    {label}
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ================= REFRESH ================= */}

                                        {onRefresh && (
                                            <CommonButton
                                                variant="secondary"
                                                onClick={handleRefresh}
                                                disabled={loading}
                                                loading={refreshing}
                                                loadingText="Refreshing..."
                                                icon={RefreshCw}
                                                title="Refresh"
                                                className="w-full sm:w-auto"
                                            >
                                                Refresh
                                            </CommonButton>
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
<tr className="border-b-2 border-orange-200 bg-orange-50">
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
                                        bg-orange-50
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
                                            bg-orange-50
                                            px-4
                                            py-3
${ALIGN_CLASS[column.align ?? "left"]}
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wide
                                            text-orange-800
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
                                            (column, colIndex) => (
                                                <td
                                                    key={colIndex}
                                                    className="px-4 py-3"
                                                >
                                                    <div
className={`h-3.5 rounded bg-gray-200 ${column.align === "right" ? "ml-auto" : ""}`}
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
                                    className="px-4 py-16"
                                >
                                    <CommonStateMessage
                                        tone="danger"
                                        icon={CircleAlert}
                                        title={error}
                                        action={
                                            onRetry && (
                                                <CommonButton
                                                    size="sm"
                                                    icon={RefreshCw}
                                                    onClick={onRetry}
                                                    loading={refreshing}
                                                    loadingText="Retrying..."
                                                >
                                                    Retry
                                                </CommonButton>
                                            )
                                        }
                                    />
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
                                    className="px-4 py-16"
                                >
                                    <CommonStateMessage
                                        icon={Inbox}
                                        title={emptyMessage}
                                        description={
                                            hasActiveFilters
                                                ? "Try changing your search or filters."
                                                : undefined
                                        }
                                    />
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
                                                getRowKey?.(row) ??
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
                                                    ${rowClassName?.(row) ?? ""}
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
                                                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180 text-orange-500" : "" }`} aria-hidden="true" />
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
                                                                ${ALIGN_CLASS[column.align ?? "left"]}
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
                        "Total" label goes in the first column,
                        the summed weight under netWeight.
                    ================================================= */}

                    {!loading && !error && (
                        <tfoot>
                            <tr className="border-t border-gray-200 bg-gray-50">
                                {expandable && (
                                    <td
                                        className="w-[52px] min-w-[52px] max-w-[52px] px-2 py-3"
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
                                            key={`total-${String(column.key)}`}
                                            style={{
                                                width: column.width,
                                                minWidth: column.width,
                                                maxWidth: column.width,
                                            }}
                                            className={`
                                                px-4
                                                py-3
                                                ${ALIGN_CLASS[column.align ?? "left"]}
                                                text-sm
                                                font-semibold
                                                text-gray-900
                                                ${column.hideOnMobile
                                                    ? "hidden sm:table-cell"
                                                    : ""
                                                }
                                            `}
                                        >
                                            {column.key === "netWeight" ? (
                                                <span>
                                                    {formatWeight(totalWeight)}{" "}
                                                    <span className="text-xs font-medium text-gray-500">
                                                        MT
                                                    </span>
                                                </span>
                                            ) : columnIndex === 0 ? (
                                                <span>Total</span>
                                            ) : null}
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

                        <CommonButton
                            variant="secondary"
                            size="sm"
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
                        >
                            Previous
                        </CommonButton>

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

                        <CommonButton
                            variant="secondary"
                            size="sm"
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
                        >
                            Next
                        </CommonButton>
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
                                <CommonButton
                                    variant="secondary"
                                    onClick={
                                        handleCloseModal
                                    }
                                >
                                    Close
                                </CommonButton>
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