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

import type { MiningObject, MiningStatus } from "@/app/types/mining";
import { miningColumns, miningExportColumns } from "./MiningColumns";
import MiningViewModal from "./MiningViewModal";
import MiningFormModal from "./MiningFormModal";
import MiningStats from "./MiningStats";

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

interface MiningTableProps {
    apiEndpoint?: string;
    pageSize?: number;
    /** Change this value to force a refetch (e.g. after adding a record). */
    refreshKey?: number;
}

const AUTO_REFRESH_MS = 60_000;

const DATE_FILTERS: TableFilter[] = [
    {
        key: "dateFilter",
        label: "Date",
        required: true,
        options: [
            { label: "Today", value: "today" },
            { label: "Last 7 Days", value: "7days" },
            { label: "All Dates", value: "all" },
            { label: "Custom Range", value: "custom" },
        ],
    },
];

/* =========================================================
   HELPERS
========================================================= */

const getToday = (): string => {
    const today = new Date();

    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${today.getFullYear()}-${month}-${day}`;
};

const getTripKey = (trip: MiningObject): string =>
    (trip as MiningObject & { _id?: string })._id ?? trip.id ?? String(trip.sno);

/* =========================================================
   COMPONENT
========================================================= */

export default function MiningTable({
    apiEndpoint = "/api/mining",
    pageSize = 50,
    refreshKey = 0,
}: MiningTableProps) {
    /* =====================================================
       STATE
    ===================================================== */

    const [trips, setTrips] = useState<MiningObject[]>([]);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState<MiningStatus | null>(null);

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

    const apiUrl = useMemo(() => {
        const params = new URLSearchParams();

        params.set(
            "dateFilter",
            dateFilter === "7days" ? "last7days" : dateFilter,
        );

        if (dateFilter === "custom") {
            params.set("startDate", customStartDate);
            params.set("endDate", customEndDate);
        }

        return `${apiEndpoint}?${params.toString()}`;
    }, [apiEndpoint, dateFilter, customStartDate, customEndDate]);

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
                    trips?: MiningObject[];
                }>(apiUrl, {
                    method: "GET",
                    cache: "no-store",
                    signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch mining trips");
                }

                if (requestId !== requestIdRef.current) {
                    return;
                }

                setTrips(Array.isArray(data?.trips) ? data.trips : []);
                setError(null);
            } catch (fetchError) {
                if (
                    fetchError instanceof DOMException &&
                    fetchError.name === "AbortError"
                ) {
                    return;
                }

                console.error("Mining Fetch Error:", fetchError);

                if (mode === "initial") {
                    setTrips([]);
                    setError(
                        "Couldn't load mining trips. Check your connection and try again.",
                    );
                } else if (mode === "refresh") {
                    toast.error(
                        "Couldn't refresh mining trips. Please try again.",
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
       SEARCH
    ===================================================== */

    const tableData = useMemo(() => {
        const searchText = search.trim().toLowerCase();

        const byStatus = statusFilter
            ? trips.filter(
                (trip) =>
                    String(trip.status ?? "").toUpperCase() === statusFilter,
            )
            : trips;

        if (!searchText) {
            return byStatus;
        }

        return byStatus.filter((trip) =>
            [
                trip.sno,
                trip.vehicleNo,
                trip.miningType,
                trip.lot,
                trip.size,
                trip.status,
                trip.loadingPoint,
                trip.loadingPerson,
                trip.unloadingPoint,
                trip.unloadingPerson,
                trip.createdBy,
            ]
                .filter((value) => value !== undefined && value !== null)
                .join(" ")
                .toLowerCase()
                .includes(searchText),
        );
    }, [trips, search, statusFilter]);

    /* =====================================================
       VIEW / EDIT
    ===================================================== */

    const [selectedTrip, setSelectedTrip] = useState<MiningObject | null>(null);

    const [modal, setModal] = useState<"view" | "edit" | null>(null);

    const handleView = useCallback((trip: MiningObject) => {
        setSelectedTrip(trip);
        setModal("view");
    }, []);

    const handleEdit = useCallback((trip: MiningObject) => {
        setSelectedTrip(trip);
        setModal("edit");
    }, []);

    const handleCloseModal = useCallback(() => {
        setModal(null);
        setSelectedTrip(null);
    }, []);

    const handleEditSuccess = useCallback(() => {
        handleCloseModal();
        void load({ mode: "silent" });
    }, [handleCloseModal, load]);

    const columns = useMemo(
        () => miningColumns({ onView: handleView, onEdit: handleEdit }),
        [handleView, handleEdit],
    );

    /* =====================================================
       FILTER CHANGE
    ===================================================== */

    const handleFilterChange = (key: string, value: string) => {
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
            <MiningStats
                trips={trips}
                loading={loading}
                error={Boolean(error)}
                activeStatus={statusFilter}
                onStatusChange={setStatusFilter}
            />

            <CommonTable<MiningObject>
                columns={columns}
                getRowKey={getTripKey}
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
                searchPlaceholder="Search vehicle, lot, point..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={DATE_FILTERS}
                filterValues={{ dateFilter }}
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
                        ? "No mining trips with this status"
                        : "No mining trips found"
                }
                pagination
                pageSize={pageSize}
                showTotal={false}
                exportable
                exportFileName="mining-trips"
                exportColumns={miningExportColumns}
            />

            <MiningViewModal
                trip={selectedTrip}
                isOpen={modal === "view"}
                onClose={handleCloseModal}
                onEdit={() => setModal("edit")}
            />

            <MiningFormModal
                trip={selectedTrip}
                isOpen={modal === "edit"}
                onClose={handleCloseModal}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
}
