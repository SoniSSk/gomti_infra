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

import type { LabObject, LabStatus } from "@/app/types/lab";
import { labColumns, labExportColumns } from "./LabColumns";
import LabViewModal from "./LabViewModal";
import LabEditModal from "./LabEditModal";
import LabStats from "./LabStats";

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

interface LabTableProps {
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

const getLabKey = (lab: LabObject): string =>
    (lab as LabObject & { _id?: string })._id ?? lab.id ?? String(lab.sno);

/* =========================================================
   COMPONENT
========================================================= */

export default function LabTable({
    apiEndpoint = "/api/lab",
    pageSize = 50,
    refreshKey = 0,
}: LabTableProps) {
    /* =====================================================
       STATE
    ===================================================== */

    const [labs, setLabs] = useState<LabObject[]>([]);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState<LabStatus | null>(null);

    const [dateFilter, setDateFilter] = useState<DateFilter>("today");

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
                    labs?: LabObject[];
                }>(apiUrl, {
                    method: "GET",
                    cache: "no-store",
                    signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch lab records");
                }

                if (requestId !== requestIdRef.current) {
                    return;
                }

                setLabs(Array.isArray(data?.labs) ? data.labs : []);
                setError(null);
            } catch (fetchError) {
                if (
                    fetchError instanceof DOMException &&
                    fetchError.name === "AbortError"
                ) {
                    return;
                }

                console.error("Lab Fetch Error:", fetchError);

                if (mode === "initial") {
                    setLabs([]);
                    setError(
                        "Couldn't load lab records. Check your connection and try again.",
                    );
                } else if (mode === "refresh") {
                    toast.error(
                        "Couldn't refresh lab records. Please try again.",
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
            ? labs.filter(
                (lab) =>
                    String(lab.status ?? "").toUpperCase() === statusFilter,
            )
            : labs;

        if (!searchText) {
            return byStatus;
        }

        return byStatus.filter((lab) =>
            [
                lab.sno,
                lab.lot,
                lab.lotDescription,
                lab.size,
                lab.status,
                lab.assignedBy,
                lab.assignedTo,
                lab.sampleTakenBy,
                lab.createdBy,
            ]
                .filter((value) => value !== undefined && value !== null)
                .join(" ")
                .toLowerCase()
                .includes(searchText),
        );
    }, [labs, search, statusFilter]);

    /* =====================================================
       VIEW / EDIT
    ===================================================== */

    const [selectedLab, setSelectedLab] = useState<LabObject | null>(null);

    const [modal, setModal] = useState<"view" | "edit" | null>(null);

    const handleView = useCallback((lab: LabObject) => {
        setSelectedLab(lab);
        setModal("view");
    }, []);

    const handleEdit = useCallback((lab: LabObject) => {
        setSelectedLab(lab);
        setModal("edit");
    }, []);

    const handleCloseModal = useCallback(() => {
        setModal(null);
        setSelectedLab(null);
    }, []);

    const handleEditSuccess = useCallback(() => {
        handleCloseModal();
        void load({ mode: "silent" });
    }, [handleCloseModal, load]);

    const columns = useMemo(
        () => labColumns({ onView: handleView, onEdit: handleEdit }),
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
            <LabStats
                labs={labs}
                loading={loading}
                error={Boolean(error)}
                activeStatus={statusFilter}
                onStatusChange={setStatusFilter}
            />

            <CommonTable<LabObject>
                columns={columns}
                getRowKey={getLabKey}
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
                searchPlaceholder="Search Lot..."
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
                        ? "No lab records with this status"
                        : "No lab records found"
                }
                pagination
                pageSize={pageSize}
                showTotal={false}
                exportable
                exportFileName="lab-reports"
                exportColumns={labExportColumns}
            />

            <LabViewModal
                lab={selectedLab}
                isOpen={modal === "view"}
                onClose={handleCloseModal}
                onEdit={() => setModal("edit")}
            />

            <LabEditModal
                lab={selectedLab}
                isOpen={modal === "edit"}
                onClose={handleCloseModal}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
}
