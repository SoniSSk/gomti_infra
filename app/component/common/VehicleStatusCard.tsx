"use client";

import { useState } from "react";

interface VehicleStatusCardProps {
  sno: number;
  tokenNo?: string;
  vehicleNo?: string;
  status: string;
  onClick?: () => void;
}

export default function VehicleStatusCard({
  sno,
  tokenNo,
  vehicleNo,
  status,
  onClick,
}: VehicleStatusCardProps) {
  const [copied, setCopied] = useState(false);

  const statusStyles: Record<string, string> = {
    WAITING_FOR_DETAILS: "bg-gray-100 text-gray-700",
    ENTRY_DONE: "bg-blue-100 text-blue-700",
    WAITING_FOR_TOKEN: "bg-yellow-100 text-yellow-700",
    LOADING_STARTED: "bg-orange-100 text-orange-700",
    LOADING_DONE: "bg-purple-100 text-purple-700",
    LOADING_SLIP_SENT: "bg-indigo-100 text-indigo-700",
    ETP_INVOICE_DONE: "bg-cyan-100 text-cyan-700",
    DISPATCH_DONE: "bg-green-100 text-green-700",
  };

  const copyVehicleNo = async () => {
    if (!vehicleNo) return;

    await navigator.clipboard.writeText(vehicleNo);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Top Accent */}
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-orange-500 to-orange-300" />

      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          S.No: {sno}
        </span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status] || "bg-gray-100 text-gray-700"
            }`}
        >
          {status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="space-y-3">
        {/* Token No */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Token No
          </p>
          <p className="text-lg font-bold text-gray-900">
            {tokenNo || "-"}
          </p>
        </div>

        {/* Vehicle No */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Vehicle No
          </p>

          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-orange-600 transition-transform duration-300 group-hover:scale-105">
              {vehicleNo || "-"}
            </p>

            {vehicleNo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copyVehicleNo();
                }}
                className="rounded-md p-1.5 text-gray-500 transition hover:bg-orange-50 hover:text-orange-600"
                title="Copy Vehicle No"
              >
                {copied ? (
                  <span className="text-xs font-semibold text-green-600">
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
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}