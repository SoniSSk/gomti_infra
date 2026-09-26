"use client";

import React, {
    useEffect,
    useId,
    useRef,
    useState,
} from "react";
import { CalendarRange, ChevronDown } from "lucide-react";

import CommonButton from "./CommonButton";

/* =========================================================
   DATE HELPERS
   Values are "YYYY-MM-DD" in local time.
========================================================= */

const toISODate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const fromISODate = (value: string): Date => {
    const [year, month, day] = value.split("-").map(Number);

    return new Date(year, month - 1, day);
};

const addDays = (date: Date, days: number): Date => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);

    return next;
};

const formatDay = (value: string, withYear: boolean): string =>
    fromISODate(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        ...(withYear ? { year: "numeric" } : {}),
    });

/** "26 Sep 2026", "20 Sep – 26 Sep 2026", "28 Dec 2025 – 3 Jan 2026" */
export const formatDateRange = (start: string, end: string): string => {
    if (!start || !end) {
        return "Select dates";
    }

    if (start === end) {
        return formatDay(start, true);
    }

    const sameYear = start.slice(0, 4) === end.slice(0, 4);

    return `${formatDay(start, !sameYear)} – ${formatDay(end, true)}`;
};

interface Preset {
    label: string;
    range: () => [string, string];
}

const PRESETS: Preset[] = [
    {
        label: "Yesterday",
        range: () => {
            const day = toISODate(addDays(new Date(), -1));

            return [day, day];
        },
    },
    {
        label: "Last 30 days",
        range: () => [
            toISODate(addDays(new Date(), -29)),
            toISODate(new Date()),
        ],
    },
    {
        label: "This month",
        range: () => {
            const today = new Date();

            return [
                toISODate(new Date(today.getFullYear(), today.getMonth(), 1)),
                toISODate(today),
            ];
        },
    },
    {
        label: "Last month",
        range: () => {
            const today = new Date();

            return [
                toISODate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
                toISODate(new Date(today.getFullYear(), today.getMonth(), 0)),
            ];
        },
    },
];

/* =========================================================
   COMPONENT
========================================================= */

export interface CommonDateRangePickerProps {
    startDate: string;
    endDate: string;
    /** Called on Apply or preset click, never with start > end. */
    onChange: (startDate: string, endDate: string) => void;
    /** Latest selectable day. Defaults to today. */
    maxDate?: string;
    /** Open the popover on mount, e.g. right after "Custom" is chosen. */
    defaultOpen?: boolean;
    className?: string;
}

const inputClass =
    "h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition hover:border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

export default function CommonDateRangePicker({
    startDate,
    endDate,
    onChange,
    maxDate,
    defaultOpen = false,
    className = "",
}: CommonDateRangePickerProps) {
    const [open, setOpen] = useState(defaultOpen);

    // Draft values; only committed on Apply.
    const [draftStart, setDraftStart] = useState(startDate);
    const [draftEnd, setDraftEnd] = useState(endDate);

    const rootRef = useRef<HTMLDivElement>(null);
    const id = useId();

    const max = maxDate ?? toISODate(new Date());

    const openPopover = () => {
        setDraftStart(startDate);
        setDraftEnd(endDate);
        setOpen(true);
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleOutside = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open]);

    // Keep start <= end by moving the other edge.
    const handleDraftStart = (value: string) => {
        setDraftStart(value);

        if (value && draftEnd && value > draftEnd) {
            setDraftEnd(value);
        }
    };

    const handleDraftEnd = (value: string) => {
        setDraftEnd(value);

        if (value && draftStart && value < draftStart) {
            setDraftStart(value);
        }
    };

    const commit = (start: string, end: string) => {
        onChange(start, end);
        setOpen(false);
    };

    const canApply = Boolean(draftStart && draftEnd) && draftStart <= draftEnd;

    return (
        <div
            ref={rootRef}
            className={`relative w-full sm:w-auto ${className}`}
        >
            <button
                type="button"
                onClick={() => (open ? setOpen(false) : openPopover())}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={`Date range: ${formatDateRange(startDate, endDate)}`}
                className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 outline-none transition hover:border-orange-400 focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-100 sm:w-auto"
            >
                <CalendarRange className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />

                <span className="truncate">
                    {formatDateRange(startDate, endDate)}
                </span>

                <ChevronDown
                    className={`ml-auto h-4 w-4 shrink-0 text-gray-400 transition ${open ? "rotate-180" : ""}`}
                    aria-hidden="true"
                />
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label="Choose date range"
                    className="absolute left-0 z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
                >
                    <div className="flex flex-wrap gap-1.5">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => commit(...preset.range())}
                                className="cursor-pointer rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                            <label
                                htmlFor={`${id}-start`}
                                className="mb-1 block text-xs font-medium text-gray-500"
                            >
                                From
                            </label>

                            <input
                                id={`${id}-start`}
                                type="date"
                                value={draftStart}
                                max={draftEnd || max}
                                onChange={(event) => handleDraftStart(event.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor={`${id}-end`}
                                className="mb-1 block text-xs font-medium text-gray-500"
                            >
                                To
                            </label>

                            <input
                                id={`${id}-end`}
                                type="date"
                                value={draftEnd}
                                min={draftStart || undefined}
                                max={max}
                                onChange={(event) => handleDraftEnd(event.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <CommonButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </CommonButton>

                        <CommonButton
                            size="sm"
                            disabled={!canApply}
                            onClick={() => commit(draftStart, draftEnd)}
                        >
                            Apply
                        </CommonButton>
                    </div>
                </div>
            )}
        </div>
    );
}
