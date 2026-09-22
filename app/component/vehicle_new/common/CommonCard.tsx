"use client";

import React from "react";

export interface CommonCardProps {
    heading: string;
    number: string | number | null | undefined;

    className?: string;
    headingClassName?: string;
    numberClassName?: string;

    onClick?: () => void;
}

const CommonCard: React.FC<CommonCardProps> = ({
    heading,
    number,
    className = "",
    headingClassName = "",
    numberClassName = "",
    onClick,
}) => {
    const displayNumber =
        number === null ||
            number === "undefined" ||
            number === ""
            ? 0
            : number;

    return (
        <div
            onClick={onClick}
            className={`
                group
                relative
                min-h-[65px]
                cursor-pointer
                overflow-hidden
                rounded-2xl
                border
                border-gray-100
                bg-white
                px-1
                py-1
                text-center
                shadow-md
                transition-all
                duration-300
                ease-in-out
                hover:-translate-y-1
                hover:border-orange-200
                hover:shadow-xl
                ${className}
            `}
        >
            {/* TOP ACCENT */}
            <div
                className="
                    absolute
                    left-0
                    top-0
                    h-1
                    w-full
                    bg-gradient-to-r
                    from-orange-500
                    to-orange-300
                "
            />

            {/* CONTENT */}
            <div className="flex min-h-[65px] flex-col items-center justify-center">
                {/* HEADING */}
                <span
                    className={`
                        text-[12px]
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-500
                        transition-colors
                        duration-300
                        group-hover:text-orange-600
                        ${headingClassName}
                    `}
                >
                    {heading}
                </span>

                {/* NUMBER */}
                <h3
                    className={`
                        mt-1
                        text-2xl
                        font-extrabold
                        text-orange-600
                        transition-transform
                        duration-300
                        group-hover:scale-105
                        ${numberClassName}
                    `}
                >
                    {displayNumber}
                </h3>
            </div>
        </div>
    );
};

export default CommonCard;