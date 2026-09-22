"use client";

import React from "react";

interface CommonTickerProps {
    text: string;
    className?: string;
    speed?: number;
}

const CommonTicker: React.FC<CommonTickerProps> = ({
    text,
    className = "",
    speed = 20,
}) => {
    return (
        <div
            className={`
        relative
        w-full
        overflow-hidden
        rounded-xl
        border
        border-orange-100
        bg-white
        shadow-md
        ${className}
      `}
        >
            {/* Orange top accent */}
            <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-orange-300 via-orange-500 to-orange-300" />

            <div className="flex min-h-[42px] items-center">

                {/* Ticker */}
                <div className="relative flex-1 overflow-hidden">
                    <div
                        className="flex w-max whitespace-nowrap  text-sm font-medium text-gray-600"
                        style={{
                            animation: `ticker ${speed}s linear infinite`,
                        }}
                    >
                        <span className="px-6">
                            {text}
                        </span>

                        <span className="px-6">
                            {text}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom light border */}
            <div className="h-[2px] w-full bg-orange-50" />

            <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
        </div>
    );
};

export default CommonTicker;