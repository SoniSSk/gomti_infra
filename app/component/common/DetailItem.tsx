/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";

interface DetailItemProps {
  label: string;
  value?: React.ReactNode;
  copyValue?: any;
}

const DetailItem: React.FC<DetailItemProps> = ({
  label,
  value,
  copyValue,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyValue) return;

    try {
      await navigator.clipboard.writeText(String(copyValue));

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      {/* Label + Copy Button */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </p>


      </div>

      {/* Value */}
      <p className="break-words text-sm font-medium text-gray-900 flex items-center justify-between">
        {value ?? (
          <span className="italic text-gray-400">
            Not Available
          </span>
        )}

        {copyValue && (
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg  text-black-600 transition hover:bg-green-50"
            title={copied ? "Copied" : "Copy"}
          >
            {copied ? (
              <span className="text-[10px]  font-semibold text-green-600">
                ✓ Copied
              </span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 8h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2"
                />
              </svg>)}
          </button>
        )}
      </p>
    </div>
  );
};

export default DetailItem;