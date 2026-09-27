"use client";

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface CommonTooltipProps {
    /** Text shown on hover / keyboard focus / tap. */
    content: React.ReactNode;
    children: React.ReactElement;
    side?: "top" | "bottom";
}

/** Minimum gap between the tooltip and the viewport edge (px). */
const VIEWPORT_GAP = 8;
/** Gap between the tooltip and its trigger (px). */
const OFFSET = 6;
/** Touch-opened tooltips close themselves after this long (ms). */
const TOUCH_HIDE_DELAY = 2000;

/*
 * Rendered in a portal with fixed positioning so it is never clipped
 * by overflow-hidden cards or modals. Sits above CommonModal (z-9999).
 *
 * Mouse: hover. Keyboard: focus. Touch: tap toggles (auto-hides).
 * The final position is clamped to the viewport and flips to the
 * other side when there is not enough room.
 */
const CommonTooltip = ({ content, children, side = "top" }: CommonTooltipProps) => {
    const id = useId();
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLSpanElement>(null);
    const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [anchor, setAnchor] = useState<DOMRect | null>(null);

    const clearTouchTimer = () => {
        if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
        }
    };

    const show = () => {
        const rect = wrapperRef.current?.getBoundingClientRect();

        if (rect) {
            setAnchor(rect);
        }
    };

    const hide = () => {
        clearTouchTimer();
        setAnchor(null);
    };

    const handlePointerEnter = (event: React.PointerEvent) => {
        if (event.pointerType !== "touch") show();
    };

    const handlePointerLeave = (event: React.PointerEvent) => {
        if (event.pointerType !== "touch") hide();
    };

    const handlePointerDown = (event: React.PointerEvent) => {
        if (event.pointerType !== "touch") return;

        if (anchor) {
            hide();
            return;
        }

        show();
        clearTouchTimer();
        touchTimerRef.current = setTimeout(hide, TOUCH_HIDE_DELAY);
    };

    /* Clamp to the viewport (and flip if needed) before paint. */
    useLayoutEffect(() => {
        const tooltip = tooltipRef.current;

        if (!anchor || !tooltip) return;

        const { width, height } = tooltip.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight;

        const left = Math.min(
            Math.max(anchor.left + anchor.width / 2 - width / 2, VIEWPORT_GAP),
            Math.max(viewportWidth - width - VIEWPORT_GAP, VIEWPORT_GAP),
        );

        const topAbove = anchor.top - height - OFFSET;
        const topBelow = anchor.bottom + OFFSET;
        const fitsAbove = topAbove >= VIEWPORT_GAP;
        const fitsBelow = topBelow + height <= viewportHeight - VIEWPORT_GAP;

        const top =
            side === "top"
                ? fitsAbove || !fitsBelow ? topAbove : topBelow
                : fitsBelow || !fitsAbove ? topBelow : topAbove;

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${Math.max(top, VIEWPORT_GAP)}px`;
        tooltip.style.visibility = "visible";
    }, [anchor, side, content]);

    /* While open: close on outside tap, scroll or resize (fixed position would go stale). */
    useEffect(() => {
        if (!anchor) return;

        const close = () => {
            if (touchTimerRef.current) {
                clearTimeout(touchTimerRef.current);
                touchTimerRef.current = null;
            }
            setAnchor(null);
        };

        const handleOutside = (event: PointerEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                close();
            }
        };

        document.addEventListener("pointerdown", handleOutside);
        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", close);

        return () => {
            document.removeEventListener("pointerdown", handleOutside);
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
        };
    }, [anchor]);

    useEffect(() => clearTouchTimer, []);

    return (
        <>
            <span
                ref={wrapperRef}
                className="inline-flex"
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
                onPointerDown={handlePointerDown}
                onFocus={show}
                onBlur={hide}
                aria-describedby={anchor ? id : undefined}
            >
                {children}
            </span>

            {anchor &&
                createPortal(
                    <span
                        ref={tooltipRef}
                        id={id}
                        role="tooltip"
                        className="pointer-events-none fixed z-[10000] w-max max-w-[calc(100vw-2rem)] break-words rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-lg"
                        style={{ left: 0, top: 0, visibility: "hidden" }}
                    >
                        {content}
                    </span>,
                    document.body,
                )}
        </>
    );
};

export default CommonTooltip;
