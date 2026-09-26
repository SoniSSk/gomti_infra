/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import CommonTable, {
    TableFilter,
} from "../common/CommonTable";

import toast from "react-hot-toast";
import { ChevronDown, RefreshCw, Timer } from "lucide-react";

import CommonDateRangePicker from "../common/CommonDateRangePicker";

import { Vehicle_new } from "@/app/types/vehicle_new";

import ViewModal from "./ViewModal";
import EditVehicleModal from "./EditModal";
import { vehicleColumns, vehicleExportColumns } from "./TableColumn";

import PulseDot from "../../common/PulseDot";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";
import { getStoredUserRole, isReadOnlyRole } from "@/app/utils/vehiclePermissions";

/* =========================================================
   TYPES
========================================================= */

type DateFilter =
    | "all"
    | "today"
    | "7days"
    | "custom";

interface VehicleTableProps {
    filters?: TableFilter[];
    initialDateFilter?: DateFilter;
    initialCustomStartDate?: string;
    initialCustomEndDate?: string;
    apiEndpoint?: string;
    onDataChange?: (vehicles: Vehicle_new[]) => void;
    onRowClick?: (vehicle: Vehicle_new) => void;
    onAdd?: () => void;
    addButtonLabel?: string;
    pagination?: boolean;
    pageSize?: number;
    emptyMessage?: string;
    /** Change this value to force a refetch (e.g. after adding a vehicle). */
    refreshKey?: number;
    /** Called on every auto refresh tick, e.g. to refresh stats too. */
    onAutoRefresh?: () => void;
}

/* =========================================================
   AUTO REFRESH
========================================================= */

const AUTO_REFRESH_OPTIONS = [
    { label: "Off", short: "Off", value: 0 },
    { label: "Every 30 seconds", short: "30s", value: 30_000 },
    { label: "Every 1 minute", short: "1m", value: 60_000 },
    { label: "Every 2 minutes", short: "2m", value: 120_000 },
    { label: "Every 5 minutes", short: "5m", value: 300_000 },
];

const DEFAULT_AUTO_REFRESH_MS = 60_000;

const AUTO_REFRESH_STORAGE_KEY = "vehicleAutoRefreshMs";

/* =========================================================
   CHANGE HIGHLIGHTS
========================================================= */

// How long new / updated rows stay highlighted
const HIGHLIGHT_MS = 2 * 60_000;

type Highlight = {
    type: "new" | "updated";
    expiresAt: number;
};

const getVehicleKey = (
    vehicle: Vehicle_new,
): string =>
    vehicle._id ??
    `${vehicle.sno ?? ""}-${vehicle.tokenNo ?? ""}-${vehicle.vehicleNo}`;

// Rows missing from `prev` are new,
// rows with a changed updatedAt are updated
const diffVehicles = (
    prev: Vehicle_new[],
    next: Vehicle_new[],
): Record<string, Highlight> => {
    const prevByKey = new Map(
        prev.map((v) => [getVehicleKey(v), v]),
    );

    const expiresAt = Date.now() + HIGHLIGHT_MS;

    const changes: Record<string, Highlight> = {};

    for (const vehicle of next) {
        const key = getVehicleKey(vehicle);
        const old = prevByKey.get(key);

        if (!old) {
            changes[key] = { type: "new", expiresAt };
        } else if (old.updatedAt !== vehicle.updatedAt) {
            changes[key] = { type: "updated", expiresAt };
        }
    }

    return changes;
};

/* =========================================================
   GET TODAY
========================================================= */

const getToday = (): string => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1,
    ).padStart(2, "0");

    const day = String(
        today.getDate(),
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

/* =========================================================
   GET VEHICLE ADDED DATE
========================================================= */

const getAddedDate = (
    vehicle: Vehicle_new,
): number => {
    const value =
        (vehicle as any).createdAt ??
        (vehicle as any).dateTime ??
        (vehicle as any).createdDate ??
        (vehicle as any).addedAt;

    if (!value) {
        return 0;
    }

    const time = new Date(value).getTime();

    return Number.isNaN(time)
        ? 0
        : time;
};

/* =========================================================
   SORT VEHICLES
   Latest added vehicle first
========================================================= */

const sortVehiclesByLatest = (
    vehicles: Vehicle_new[],
): Vehicle_new[] => {
    return [...vehicles].sort(
        (a, b) =>
            getAddedDate(b) -
            getAddedDate(a),
    );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Test({
    filters = [],
    initialDateFilter = "today",
    initialCustomStartDate = getToday(),
    initialCustomEndDate = getToday(),
    apiEndpoint = "/api/vehicles",
    onDataChange,
    onRowClick,
    onAdd,
    addButtonLabel = "Add Vehicle",
    pagination = true,
    pageSize = 50,
    emptyMessage = "No vehicles found",
    refreshKey = 0,
    onAutoRefresh,
}: VehicleTableProps) {
    /* =====================================================
       STATE
    ===================================================== */

    const [vehicles, setVehicles] =
        useState<Vehicle_new[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [search, setSearch] =
        useState("");

    const [dateFilter, setDateFilter] =
        useState<DateFilter>(
            initialDateFilter,
        );

    const [customStartDate, setCustomStartDate] =
        useState(initialCustomStartDate);

    const [customEndDate, setCustomEndDate] =
        useState(initialCustomEndDate);

    const [openRangePicker, setOpenRangePicker] =
        useState(false);

    const hasCustomRange =
        Boolean(customStartDate && customEndDate) &&
        customStartDate <= customEndDate;

    /* =====================================================
       VIEW / EDIT MODAL STATE
    ===================================================== */

    const [selectedVehicle, setSelectedVehicle] =
        useState<Vehicle_new | null>(null);

    const [isViewModalOpen, setIsViewModalOpen] =
        useState(false);

    const [isEditModalOpen, setIsEditModalOpen] =
        useState(false);

    /* =====================================================
       REQUEST TRACKING

       Latest request id, so a slow response can't
       overwrite a newer one (e.g. after a filter change).
    ===================================================== */

    const requestIdRef = useRef(0);

    const inFlightRef = useRef(false);

    const [lastUpdated, setLastUpdated] =
        useState<Date | null>(null);

    // Spins the refresh icon during auto refresh
    const [backgroundRefreshing, setBackgroundRefreshing] =
        useState(false);

    /* =====================================================
       CHANGE HIGHLIGHTS
    ===================================================== */

    const [highlights, setHighlights] =
        useState<Record<string, Highlight>>({});

    // Last loaded list + its URL, to diff only
    // between loads of the same filter
    const lastVehiclesRef =
        useRef<Vehicle_new[]>([]);

    const lastLoadUrlRef =
        useRef<string | null>(null);

    // Drop highlights as they expire
    useEffect(() => {
        const expiries = Object.values(
            highlights,
        ).map((h) => h.expiresAt);

        if (!expiries.length) return;

        const timer = setTimeout(() => {
            const now = Date.now();

            setHighlights((prev) =>
                Object.fromEntries(
                    Object.entries(prev).filter(
                        ([, h]) => h.expiresAt > now,
                    ),
                ),
            );
        }, Math.max(0, Math.min(...expiries) - Date.now()));

        return () => clearTimeout(timer);
    }, [highlights]);

    /* =====================================================
       AUTO REFRESH INTERVAL
    ===================================================== */

    const [autoRefreshMs, setAutoRefreshMs] =
        useState(DEFAULT_AUTO_REFRESH_MS);

    useEffect(() => {
        const saved = localStorage.getItem(
            AUTO_REFRESH_STORAGE_KEY,
        );

        const option = AUTO_REFRESH_OPTIONS.find(
            (o) => String(o.value) === saved,
        );

        if (option) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAutoRefreshMs(option.value);
        }
    }, []);

    const handleAutoRefreshChange = (
        value: number,
    ) => {
        setAutoRefreshMs(value);

        try {
            localStorage.setItem(
                AUTO_REFRESH_STORAGE_KEY,
                String(value),
            );
        } catch {
            // Storage unavailable: keep it for this session
        }
    };

    /* =====================================================
       API URL
    ===================================================== */

    const buildApiUrl = useCallback(
        (
            selectedFilter: DateFilter,
            startDate?: string,
            endDate?: string,
        ) => {
            const params =
                new URLSearchParams();

            const apiFilter =
                selectedFilter === "7days"
                    ? "last7days"
                    : selectedFilter;

            params.set(
                "dateFilter",
                apiFilter,
            );

            if (
                apiFilter === "custom" &&
                startDate &&
                endDate
            ) {
                params.set(
                    "startDate",
                    startDate,
                );

                params.set(
                    "endDate",
                    endDate,
                );
            }

            return `${apiEndpoint}?${params.toString()}`;
        },
        [apiEndpoint],
    );

    /* =====================================================
       APPLY FETCHED VEHICLES

       Sorts, and highlights what changed since the
       last load of the same URL.
    ===================================================== */

    const applyVehicles = useCallback(
        (
            url: string,
            fetchedVehicles: Vehicle_new[],
        ) => {
            const sortedVehicles =
                sortVehiclesByLatest(
                    fetchedVehicles,
                );

            if (lastLoadUrlRef.current === url) {
                const changes = diffVehicles(
                    lastVehiclesRef.current,
                    sortedVehicles,
                );

                if (Object.keys(changes).length) {
                    setHighlights((prev) => ({
                        ...prev,
                        ...changes,
                    }));
                }
            } else {
                // Filter changed: nothing is "new"
                setHighlights({});
            }

            lastLoadUrlRef.current = url;
            lastVehiclesRef.current = sortedVehicles;

            setVehicles(
                sortedVehicles,
            );

            setLastUpdated(new Date());

            onDataChange?.(
                sortedVehicles,
            );
        },
        [onDataChange],
    );

    /* =====================================================
       FETCH DATA
    ===================================================== */

    useEffect(() => {
        let cancelled = false;

        const controller =
            new AbortController();

        const loadData = async () => {
            if (
                dateFilter === "custom" &&
                !hasCustomRange
            ) {
                return;
            }

            const requestId =
                ++requestIdRef.current;

            try {
                inFlightRef.current = true;

                setLoading(true);
                setError(null);

                const url =
                    buildApiUrl(
                        dateFilter,
                        customStartDate,
                        customEndDate,
                    );

                console.log(
                    "Vehicle API:",
                    url,
                );

                const response =
                    await fetch(url, {
                        method: "GET",
                        cache: "no-store",
                        signal:
                            controller.signal,
                    });

                if (!response.ok) {
                    throw new Error(
                        "Failed to fetch vehicles",
                    );
                }

                const result =
                    await response.json();

                const fetchedVehicles:
                    Vehicle_new[] =
                    Array.isArray(
                        result?.vehicles,
                    )
                        ? result.vehicles
                        : [];

                if (
                    cancelled ||
                    requestId !== requestIdRef.current
                ) {
                    return;
                }

                applyVehicles(
                    url,
                    fetchedVehicles,
                );
            } catch (error) {
                if (
                    error instanceof
                    DOMException &&
                    error.name ===
                    "AbortError"
                ) {
                    return;
                }

                if (cancelled) {
                    return;
                }

                console.error(
                    "Vehicle Fetch Error:",
                    error,
                );

                setVehicles([]);

                // Don't diff the next load against
                // an emptied list
                lastLoadUrlRef.current = null;

                setError(
                    "Couldn't load vehicles. Check your connection and try again.",
                );

                onDataChange?.([]);
            } finally {
                if (requestId === requestIdRef.current) {
                    inFlightRef.current = false;
                }

                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadData();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [
        dateFilter,
        customStartDate,
        customEndDate,
        hasCustomRange,
        buildApiUrl,
        applyVehicles,
        onDataChange,
        refreshKey,
    ]);

    /* =====================================================
       DATE FILTER OPTIONS
    ===================================================== */

    const dateFilterOptions:
        TableFilter[] =
        useMemo(
            () => [
                {
                    key: "dateFilter",
                    label: "Date",
                    required: true,
                    options: [
                        {
                            label: "Today",
                            value: "today",
                        },
                        {
                            label: "Last 7 Days",
                            value: "7days",
                        },
                        {
                            label: "All Dates",
                            value: "all",
                        },
                        {
                            label: "Custom Range",
                            value: "custom",
                        },
                    ],
                },
            ],
            [],
        );

    /* =====================================================
       ALL FILTERS
    ===================================================== */

    const tableFilters =
        useMemo<TableFilter[]>(
            () => [
                ...dateFilterOptions,
                ...filters,
            ],
            [
                dateFilterOptions,
                filters,
            ],
        );

    /* =====================================================
       SEARCH
    ===================================================== */

    const searchableVehicles =
        useMemo(() => {
            const searchText =
                search
                    .trim()
                    .toLowerCase();

            if (!searchText) {
                return vehicles;
            }

            return vehicles.filter(
                (vehicle) => {
                    const searchableText = [
                        vehicle.tokenNo,
                        vehicle.vehicleNo,
                        vehicle.driverName,
                        vehicle.driverContact,
                        vehicle.materialName,
                        vehicle.materialGrade,
                        vehicle.destination,
                        vehicle.transporterName,
                        vehicle.buyerDetails,
                        vehicle.status,
                        vehicle.sno,
                    ]
                        .filter(
                            (value) =>
                                value !==
                                undefined &&
                                value !== null,
                        )
                        .join(" ")
                        .toLowerCase();

                    return searchableText.includes(
                        searchText,
                    );
                },
            );
        }, [
            vehicles,
            search,
        ]);

    /* =====================================================
       TABLE DATA
    ===================================================== */

    const tableData =
        useMemo(
            () =>
                searchableVehicles.map(
                    (vehicle) => ({
                        ...vehicle,
                        sno: vehicle.sno,
                    }),
                ),
            [
                searchableVehicles,
            ],
        );

    /* =====================================================
       VIEW VEHICLE
    ===================================================== */

    const handleViewVehicle =
        useCallback(
            (vehicle: Vehicle_new) => {
                setSelectedVehicle(
                    vehicle,
                );

                setIsEditModalOpen(
                    false,
                );

                setIsViewModalOpen(
                    true,
                );

                onRowClick?.(
                    vehicle,
                );
            },
            [onRowClick],
        );

    /* =====================================================
       EDIT VEHICLE
    ===================================================== */

    const handleEditVehicle =
        useCallback(
            (vehicle: Vehicle_new) => {
                setSelectedVehicle(
                    vehicle,
                );

                setIsViewModalOpen(
                    false,
                );

                setIsEditModalOpen(
                    true,
                );
            },
            [],
        );

    /* =====================================================
       VEHICLE COLUMNS
    ===================================================== */

    const vehicleColumnss =
        useMemo(
            () =>
                vehicleColumns({
                    onView:
                        handleViewVehicle,

                    onEdit:
                        handleEditVehicle,
                }).map((column) => {
                    if (column.key !== "vehicleNo") {
                        return column;
                    }

                    // Pulse badge on new / updated rows
                    return {
                        ...column,
                        render: (row: Vehicle_new) => {
                            const highlight =
                                highlights[getVehicleKey(row)];

                            return (
                                <div className="flex items-start gap-2">
                                    {column.render
                                        ? column.render(row)
                                        : row.vehicleNo}

                                    {highlight && (
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${highlight.type === "new"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-amber-100 text-amber-700"
                                                }`}
                                        >
                                            <PulseDot
                                                tone={
                                                    highlight.type === "new"
                                                        ? "green"
                                                        : "amber"
                                                }
                                            />

                                            {highlight.type === "new"
                                                ? "New"
                                                : "Updated"}
                                        </span>
                                    )}
                                </div>
                            );
                        },
                    };
                }),
            [
                handleViewVehicle,
                handleEditVehicle,
                highlights,
            ],
        );

    /* =====================================================
       CHANGE COUNTS (visible rows only)
    ===================================================== */

    const highlightCounts =
        useMemo(() => {
            let newCount = 0;
            let updatedCount = 0;

            for (const vehicle of vehicles) {
                const type =
                    highlights[getVehicleKey(vehicle)]?.type;

                if (type === "new") newCount++;
                else if (type === "updated") updatedCount++;
            }

            return { newCount, updatedCount };
        }, [
            vehicles,
            highlights,
        ]);

    /* =====================================================
       DATE FILTER CHANGE
    ===================================================== */

    const handleDateFilterChange =
        (
            value: string,
        ) => {
            const nextFilter =
                value as DateFilter;

            setDateFilter(
                nextFilter,
            );

            // Open the picker when the user picks
            // "Custom Range", not on first render.
            setOpenRangePicker(
                nextFilter === "custom",
            );

            // Start the range on today so the first
            // fetch happens immediately.
            if (
                nextFilter ===
                "custom" &&
                !hasCustomRange
            ) {
                setCustomStartDate(
                    getToday(),
                );

                setCustomEndDate(
                    getToday(),
                );
            }
        };

    /* =====================================================
       FILTER CHANGE
    ===================================================== */

    const handleFilterChange =
        (
            key: string,
            value: string,
        ) => {
            if (
                key ===
                "dateFilter"
            ) {
                handleDateFilterChange(
                    value,
                );
            }
        };

    /* =====================================================
       REFRESH
    ===================================================== */

    /*
     * silent: background refresh. No spinner, no toast,
     * and existing rows stay if it fails.
     */
    const refetch =
        useCallback(
            async (
                { silent = false }: { silent?: boolean } = {},
            ) => {
                const requestId =
                    ++requestIdRef.current;

                try {
                    inFlightRef.current = true;

                    if (silent) {
                        setBackgroundRefreshing(true);
                    } else {
                        setRefreshing(
                            true,
                        );
                    }

                    const url =
                        buildApiUrl(
                            dateFilter,
                            customStartDate,
                            customEndDate,
                        );

                    console.log(
                        silent
                            ? "Vehicle Auto Refresh API:"
                            : "Vehicle Refresh API:",
                        url,
                    );

                    const response =
                        await fetch(
                            url,
                            {
                                method:
                                    "GET",
                                cache:
                                    "no-store",
                            },
                        );

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            "Failed to refresh vehicles",
                        );
                    }

                    const result =
                        await response.json();

                    if (
                        requestId !==
                        requestIdRef.current
                    ) {
                        return;
                    }

                    applyVehicles(
                        url,
                        Array.isArray(
                            result?.vehicles,
                        )
                            ? result.vehicles
                            : [],
                    );

                    setError(null);
                } catch (error) {
                    console.error(
                        "Vehicle Refresh Error:",
                        error,
                    );

                    if (!silent) {
                        toast.error(
                            "Couldn't refresh vehicles. Please try again.",
                        );
                    }
                } finally {
                    if (requestId === requestIdRef.current) {
                        inFlightRef.current = false;
                    }

                    if (silent) {
                        setBackgroundRefreshing(false);
                    } else {
                        setRefreshing(
                            false,
                        );
                    }
                }
            },
            [
                buildApiUrl,
                applyVehicles,
                dateFilter,
                customStartDate,
                customEndDate,
            ],
        );

    const handleRefresh =
        useCallback(
            () => refetch(),
            [refetch],
        );

    /* =====================================================
       AUTO REFRESH

       Paused while editing or with an incomplete
       custom range, and while the tab is hidden.
    ===================================================== */

    useAutoRefresh(
        () => {
            onAutoRefresh?.();

            if (inFlightRef.current) return;

            void refetch({ silent: true });
        },
        {
            intervalMs: autoRefreshMs,
            enabled:
                !isEditModalOpen &&
                !(
                    dateFilter === "custom" &&
                    !hasCustomRange
                ),
        },
    );

    const autoRefreshOption =
        AUTO_REFRESH_OPTIONS.find(
            (o) => o.value === autoRefreshMs,
        ) ?? AUTO_REFRESH_OPTIONS[0];

    const autoRefreshOn = autoRefreshMs > 0;

    const refreshBusy =
        refreshing || backgroundRefreshing;

    /*
     * Split button: left refreshes now, right picks the
     * auto refresh interval (transparent native select
     * on top handles input). Styled like CommonButton
     * "secondary".
     */
    const refreshContent = (
        <div
            title={
                lastUpdated
                    ? `Last updated ${lastUpdated.toLocaleTimeString()}`
                    : undefined
            }
            className="inline-flex h-10 w-full shrink-0 items-stretch overflow-hidden whitespace-nowrap rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm sm:w-auto"
        >
            <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 px-4 transition duration-150 hover:bg-orange-50 hover:text-orange-700 focus:outline-none focus-visible:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <RefreshCw
                    className={`h-4 w-4 ${refreshBusy ? "animate-spin" : ""}`}
                    aria-hidden="true"
                />

                {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <div className="relative inline-flex items-center gap-1.5 border-l border-gray-200 px-3 transition duration-150 focus-within:bg-orange-50 hover:bg-orange-50 hover:text-orange-700">
                {autoRefreshOn ? (
                    <PulseDot />
                ) : (
                    <Timer className="h-4 w-4" aria-hidden="true" />
                )}

                <span>{autoRefreshOption.short}</span>

                <ChevronDown className="h-4 w-4" aria-hidden="true" />

                <select
                    aria-label="Auto refresh interval"
                    value={autoRefreshMs}
                    onChange={(event) =>
                        handleAutoRefreshChange(
                            Number(event.target.value),
                        )
                    }
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                >
                    {AUTO_REFRESH_OPTIONS.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.value
                                ? `Auto refresh: ${option.label.toLowerCase()}`
                                : "Auto refresh: off"}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );

    /* =====================================================
       CUSTOM RANGE FILTER
    ===================================================== */

    const customRangeContent =
        dateFilter ===
            "custom" ? (
            <CommonDateRangePicker
                startDate={customStartDate}
                endDate={customEndDate}
                defaultOpen={openRangePicker}
                onChange={(start, end) => {
                    setCustomStartDate(start);
                    setCustomEndDate(end);
                }}
            />
        ) : null;

    /* =====================================================
       CLOSE VIEW MODAL
    ===================================================== */

    const handleCloseViewModal =
        useCallback(() => {
            setIsViewModalOpen(
                false,
            );

            setSelectedVehicle(
                null,
            );
        }, []);

    /* =====================================================
       CLOSE EDIT MODAL
    ===================================================== */

    const handleCloseEditModal =
        useCallback(() => {
            setIsEditModalOpen(
                false,
            );

            setSelectedVehicle(
                null,
            );
        }, []);

    /* =====================================================
       VIEW → EDIT
    ===================================================== */

    const handleViewToEdit =
        useCallback(() => {
            if (
                !selectedVehicle
            ) {
                return;
            }

            setIsViewModalOpen(
                false,
            );

            setIsEditModalOpen(
                true,
            );
        }, [
            selectedVehicle,
        ]);

    /* =====================================================
       EDIT SUCCESS
    ===================================================== */

    const handleEditSuccess =
        useCallback(
            async () => {
                setIsEditModalOpen(
                    false,
                );

                setSelectedVehicle(
                    null,
                );

                await handleRefresh();
            },
            [
                handleRefresh,
            ],
        );

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <>
            <div className="space-y-3">
            {/* CHANGE BANNER */}

            {(highlightCounts.newCount > 0 ||
                highlightCounts.updatedCount > 0) && (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
                        <span className="inline-flex items-center gap-2 font-medium">
                            <PulseDot />

                            {[
                                highlightCounts.newCount > 0 &&
                                `${highlightCounts.newCount} new vehicle${highlightCounts.newCount > 1 ? "s" : ""}`,
                                highlightCounts.updatedCount > 0 &&
                                `${highlightCounts.updatedCount} updated`,
                            ]
                                .filter(Boolean)
                                .join(" · ")}
                        </span>

                        <button
                            type="button"
                            onClick={() => setHighlights({})}
                            className="cursor-pointer text-xs font-medium text-green-700 hover:underline"
                        >
                            Clear
                        </button>
                    </div>
                )}

            <CommonTable<Vehicle_new>
                columns={
                    vehicleColumnss
                }

                getRowKey={
                    getVehicleKey
                }

                rowClassName={(row) => {
                    const highlight =
                        highlights[getVehicleKey(row)];

                    if (!highlight) return "";

                    return highlight.type === "new"
                        ? "bg-green-50"
                        : "bg-amber-50";
                }}

                headerContent={
                    refreshContent
                }

                data={
                    tableData
                }

                loading={
                    loading
                }

                error={
                    error
                }

                onRetry={
                    handleRefresh
                }

                // Spinner for the error state's Retry button
                refreshing={
                    refreshing
                }

                searchable

                searchPlaceholder="Search Vehicle..."

                searchValue={
                    search
                }

                onSearchChange={
                    setSearch
                }

                filters={
                    tableFilters
                }

                filterValues={{
                    dateFilter,
                }}

                onFilterChange={
                    handleFilterChange
                }

                emptyMessage={
                    emptyMessage
                }

                pagination={
                    pagination
                }

                pageSize={
                    pageSize
                }


                onAdd={
                    onAdd
                }

                addButtonLabel={
                    addButtonLabel
                }

                filterContent={
                    customRangeContent
                }

                exportable

                exportFileName="vehicles"

                exportColumns={
                    vehicleExportColumns
                }
            />
            </div>

            {/* =================================================
                VIEW MODAL
            ================================================= */}

            <ViewModal
                vehicle={
                    selectedVehicle
                }

                isOpen={
                    isViewModalOpen
                }

                onClose={
                    handleCloseViewModal
                }

                onEdit={
                    // Customers get a read-only view
                    isReadOnlyRole(getStoredUserRole())
                        ? undefined
                        : handleViewToEdit
                }
            />

            {/* =================================================
                EDIT MODAL
            ================================================= */}

            <EditVehicleModal
                vehicle={
                    selectedVehicle
                }

                isOpen={
                    isEditModalOpen
                }

                onClose={
                    handleCloseEditModal
                }

                onSuccess={
                    handleEditSuccess
                }
            />
        </>
    );
}