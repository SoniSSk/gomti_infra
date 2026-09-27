"use client";

import React, {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
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
   POPOVER PLACEMENT

   Width alone doesn't say "desktop": an unfolded foldable is
   wider than `sm` but can be short, and the table card clips
   anything absolutely positioned inside it. So the popover is
   portalled to <body>, placed from the trigger's on-screen
   rect and kept inside the viewport.
========================================================= */

// Below this width (Tailwind `sm`) always use the centered sheet
const ANCHOR_MIN_WIDTH = 640;
const POPOVER_WIDTH = 320;
const GAP = 8;
const GUTTER = 16;

type Placement =
    | { mode: "sheet" }
    | {
          mode: "anchored";
          left: number;
          width: number;
          maxHeight: number;
          top?: number;
          bottom?: number;
      };

const computePlacement = (
    trigger: HTMLElement,
    popover: HTMLElement,
): Placement => {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;

    if (viewportWidth < ANCHOR_MIN_WIDTH) {
        return { mode: "sheet" };
    }

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(POPOVER_WIDTH, viewportWidth - GUTTER * 2);

    const left = Math.min(
        Math.max(rect.left, GUTTER),
        viewportWidth - GUTTER - width,
    );

    const spaceBelow = viewportHeight - rect.bottom - GAP - GUTTER;
    const spaceAbove = rect.top - GAP - GUTTER;
    const height = popover.scrollHeight;

    // Fits neither side (e.g. half-folded): center it instead
    if (height > Math.max(spaceBelow, spaceAbove)) {
        return { mode: "sheet" };
    }

    if (height <= spaceBelow || spaceBelow >= spaceAbove) {
        return {
            mode: "anchored",
            left,
            width,
            top: rect.bottom + GAP,
            maxHeight: spaceBelow,
        };
    }

    return {
        mode: "anchored",
        left,
        width,
        bottom: viewportHeight - rect.top + GAP,
        maxHeight: spaceAbove,
    };
};

const subscribeNoop = () => () => {};

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
    "h-10 w-full min-w-0 cursor-pointer rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-700 sm:text-sm outline-none transition hover:border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

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
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const id = useId();

    // null until measured; the popover renders hidden until then
    const [placement, setPlacement] = useState<Placement | null>(null);

    // Portals need document, which the server render doesn't have
    const isClient = useSyncExternalStore(
        subscribeNoop,
        () => true,
        () => false,
    );

    const max = maxDate ?? toISODate(new Date());

    const openPopover = () => {
        setDraftStart(startDate);
        setDraftEnd(endDate);
        // Re-measure: the trigger or viewport may have moved
        setPlacement(null);
        setOpen(true);
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            // The popover is portalled, so it isn't inside rootRef
            if (
                !rootRef.current?.contains(target) &&
                !popoverRef.current?.contains(target)
            ) {
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

    const updatePlacement = useCallback(() => {
        if (triggerRef.current && popoverRef.current) {
            setPlacement(
                computePlacement(triggerRef.current, popoverRef.current),
            );
        }
    }, []);

    // Measure before paint, then follow resizes (incl. fold /
    // unfold and rotation) and scrolling of any ancestor.
    useLayoutEffect(() => {
        if (!open) {
            return;
        }

        updatePlacement();

        let frame = 0;

        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(updatePlacement);
        };

        window.addEventListener("resize", schedule);
        window.addEventListener("scroll", schedule, true);
        window.visualViewport?.addEventListener("resize", schedule);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("resize", schedule);
            window.removeEventListener("scroll", schedule, true);
            window.visualViewport?.removeEventListener("resize", schedule);
        };
    }, [open, updatePlacement]);

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
                ref={triggerRef}
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

            {open && isClient && createPortal(
                <>
                {/* Sheet mode: dimmed backdrop behind the centered sheet */}
                {placement?.mode === "sheet" && (
                    <div
                        aria-hidden="true"
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 z-40 bg-gray-900/20"
                    />
                )}

                {/* Sheet (narrow or short screens): fixed and centered.
                    Anchored: fixed at the trigger, clamped to the viewport. */}
                <div
                    ref={popoverRef}
                    role="dialog"
                    aria-label="Choose date range"
                    style={
                        placement?.mode === "anchored"
                            ? {
                                  left: placement.left,
                                  width: placement.width,
                                  top: placement.top,
                                  bottom: placement.bottom,
                                  maxHeight: placement.maxHeight,
                              }
                            : undefined
                    }
                    className={`fixed z-50 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-4 shadow-lg ${
                        placement?.mode === "anchored"
                            ? ""
                            : "inset-x-4 top-1/2 mx-auto max-h-[calc(100dvh-2rem)] max-w-sm -translate-y-1/2"
                    } ${placement ? "" : "invisible"}`}
                >
                    <div className="flex flex-wrap gap-1.5">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => commit(...preset.range())}
                                className="cursor-pointer rounded-full border border-gray-200 px-3 py-2 text-xs sm:px-2.5 sm:py-1 font-medium text-gray-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="min-w-0">
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

                        <div className="min-w-0">
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
                </>,
                document.body,
            )}
        </div>
    );
}
