"use client";

import React from "react";

interface TickerProps {
    items: string[];
    speed?: number;
    className?: string;
}

export default function Ticker({
    items,
    speed = 20,
    className = "",
}: TickerProps) {
    const tickerItems = [...items, ...items];

    return (
        <div
            className={`rounded-md mb-4 w-full overflow-hidden bg-[#ff6b00] text-white ${className}`}
        >
            <div
                className="flex w-max animate-ticker whitespace-nowrap"
                style={{
                    animationDuration: `${speed}s`,
                }}
            >
                {tickerItems.map((item, index) => (
                    <React.Fragment key={index}>
                        <span className="px-6 py-2 text-sm font-semibold">
                            {item}
                        </span>

                        <span className="py-2 text-gray-400">•</span>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}