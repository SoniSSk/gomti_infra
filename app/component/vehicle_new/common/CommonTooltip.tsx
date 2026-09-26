"use client";

import React, { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface CommonTooltipProps {
    /** Text shown on hover / keyboard focus. */
    content: React.ReactNode;
    children: React.ReactElement;
    side?: "top" | "bottom";
}

/*
 * Rendered in a portal with fixed positioning so it is never clipped
 * by overflow-hidden cards or modals. Sits above CommonModal (z-9999).
 */
const CommonTooltip = ({ content, children, side = "top" }: CommonTooltipProps) => {
    const id = useId();
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

    const show = () => {
        const rect = wrapperRef.current?.getBoundingClientRect();

        if (rect) {
            setPosition({
                x: rect.left + rect.width / 2,
                y: side === "top" ? rect.top : rect.bottom,
            });
        }
    };

    const hide = () => setPosition(null);

    return (
        <>
            <span
                ref={wrapperRef}
                className="inline-flex"
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                aria-describedby={position ? id : undefined}
            >
                {children}
            </span>

            {position &&
                createPortal(
                    <span
                        id={id}
                        role="tooltip"
                        className={`pointer-events-none fixed z-[10000] -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-lg ${
                            side === "top" ? "-translate-y-full -mt-1.5" : "mt-1.5"
                        }`}
                        style={{ left: position.x, top: position.y }}
                    >
                        {content}
                    </span>,
                    document.body,
                )}
        </>
    );
};

export default CommonTooltip;
