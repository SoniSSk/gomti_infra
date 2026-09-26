"use client";

import React from "react";

export interface CommonCardProps {
    heading: string;
    number: string | number | null | undefined;

    className?: string;
    headingClassName?: string;
    numberClassName?: string;

    onClick?: () => void;

    /** Shows a placeholder instead of the number (avoids a misleading 0). */
    loading?: boolean;

    /** Tailwind bg-* class for the accent bar, e.g. "bg-green-500". */
    accent?: string;

    /** Optional short helper line under the number. */
    description?: string;
}

const CommonCard: React.FC<CommonCardProps> = ({
    heading,
    number,
    className = "",
    headingClassName = "",
    numberClassName = "",
    onClick,
    loading = false,
    accent = "bg-orange-500",
    description,
}) => {
    const interactive = Boolean(onClick);

    const displayNumber =
        number === null ||
            number === undefined ||
            number === "undefined" ||
            number === ""
            ? 0
            : number;

    const Wrapper = interactive ? "button" : "div";

    return (
        <Wrapper
            {...(interactive
                ? { type: "button" as const, onClick }
                : {})}
            className={`
                relative
                flex
                w-full
                flex-col
                overflow-hidden
                rounded-xl
                border
                border-gray-200
                bg-white
                p-4
                text-left
                shadow-sm
                transition
                duration-200
                ${interactive
                    ? "cursor-pointer hover:border-orange-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-200"
                    : ""}
                ${className}
            `}
        >
            {/* ACCENT */}
            <span
                className={`absolute inset-y-0 left-0 w-1 ${accent}`}
                aria-hidden="true"
            />

            {/* HEADING */}
            <span
                className={`
                    truncate
                    text-xs
                    font-medium
                    text-gray-500
                    sm:text-sm
                    ${headingClassName}
                `}
            >
                {heading}
            </span>

            {/* NUMBER */}
            <span
                className={`
                    mt-1.5
                    text-2xl
                    font-semibold
                    leading-none
                    tabular-nums
                    text-gray-900
                    sm:text-3xl
                    ${numberClassName}
                `}
            >
                {loading ? (
                    <span
                        className="block h-7 w-14 animate-pulse rounded bg-gray-200 sm:h-8"
                        aria-label="Loading"
                    />
                ) : (
                    displayNumber
                )}
            </span>

            {description && (
                <span className="mt-1.5 truncate text-xs text-gray-400">
                    {description}
                </span>
            )}
        </Wrapper>
    );
};

export default CommonCard;
