/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import CommonTable, {
    TableFilter,
} from "../common/CommonTable";

import toast from "react-hot-toast";

import { Vehicle_new } from "@/app/types/vehicle_new";

import ViewModal from "./ViewModal";
import EditVehicleModal from "./EditModal";
import { vehicleColumns } from "./TableColumn";

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
    initialCustomDate?: string;
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
}

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
    initialCustomDate = getToday(),
    apiEndpoint = "/api/vehicles",
    onDataChange,
    onRowClick,
    onAdd,
    addButtonLabel = "Add Vehicle",
    pagination = true,
    pageSize = 50,
    emptyMessage = "No vehicles found",
    refreshKey = 0,
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

    const [customDate, setCustomDate] =
        useState(initialCustomDate);

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
       API URL
    ===================================================== */

    const buildApiUrl = useCallback(
        (
            selectedFilter: DateFilter,
            selectedDate?: string,
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
                selectedDate
            ) {
                params.set(
                    "date",
                    selectedDate,
                );
            }

            return `${apiEndpoint}?${params.toString()}`;
        },
        [apiEndpoint],
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
                !customDate
            ) {
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const url =
                    buildApiUrl(
                        dateFilter,
                        dateFilter ===
                            "custom"
                            ? customDate
                            : undefined,
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

                if (cancelled) {
                    return;
                }

                /* =========================================
                   SORT
                   Latest added first
                ========================================= */

                const sortedVehicles =
                    sortVehiclesByLatest(
                        fetchedVehicles,
                    );

                setVehicles(
                    sortedVehicles,
                );

                onDataChange?.(
                    sortedVehicles,
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

                setError(
                    "Couldn't load vehicles. Check your connection and try again.",
                );

                onDataChange?.([]);
            } finally {
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
        customDate,
        buildApiUrl,
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
                            label: "Custom Date",
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
                }),
            [
                handleViewVehicle,
                handleEditVehicle,
            ],
        );

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

            if (
                nextFilter !==
                "custom"
            ) {
                setCustomDate("");
            }

            if (
                nextFilter ===
                "custom" &&
                !customDate
            ) {
                setCustomDate(
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
       CUSTOM DATE
    ===================================================== */

    const handleCustomDateChange =
        (
            value: string,
        ) => {
            setCustomDate(value);
        };

    /* =====================================================
       REFRESH
    ===================================================== */

    const handleRefresh =
        useCallback(
            async () => {
                try {
                    setRefreshing(
                        true,
                    );

                    const url =
                        buildApiUrl(
                            dateFilter,
                            dateFilter ===
                                "custom"
                                ? customDate
                                : undefined,
                        );

                    console.log(
                        "Vehicle Refresh API:",
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

                    const refreshedVehicles:
                        Vehicle_new[] =
                        Array.isArray(
                            result?.vehicles,
                        )
                            ? result
                                .vehicles
                            : [];

                    /* =====================================
                       SORT
                       Latest added first
                    ===================================== */

                    const sortedVehicles =
                        sortVehiclesByLatest(
                            refreshedVehicles,
                        );

                    setVehicles(
                        sortedVehicles,
                    );

                    setError(null);

                    onDataChange?.(
                        sortedVehicles,
                    );
                } catch (error) {
                    console.error(
                        "Vehicle Refresh Error:",
                        error,
                    );

                    toast.error(
                        "Couldn't refresh vehicles. Please try again.",
                    );
                } finally {
                    setRefreshing(
                        false,
                    );
                }
            },
            [
                buildApiUrl,
                dateFilter,
                customDate,
                onDataChange,
            ],
        );

    /* =====================================================
       CUSTOM DATE HEADER
    ===================================================== */

    const headerContent =
        dateFilter ===
            "custom" ? (
            <div className="w-full">
                <input
                    type="date"
                    value={
                        customDate
                    }
                    onChange={(
                        event,
                    ) =>
                        handleCustomDateChange(
                            event
                                .target
                                .value,
                        )
                    }
                    className="
                        h-10
                        w-full
                        rounded-lg
                        border
                        border-gray-300
                        bg-white
                        px-3
                        text-sm
                        text-gray-700
                        outline-none
                        transition
                        hover:border-orange-400
                        focus:border-orange-500
                        focus:ring-1
                        focus:ring-orange-100
                    "
                />
            </div>
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
            <CommonTable<Vehicle_new>
                columns={
                    vehicleColumnss
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

                onRefresh={
                    handleRefresh
                }

                refreshing={
                    refreshing
                }

                onAdd={
                    onAdd
                }

                addButtonLabel={
                    addButtonLabel
                }

                headerContent={
                    headerContent
                }
            />

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
                    handleViewToEdit
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