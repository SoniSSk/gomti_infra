"use client";

import { Vehicle } from "@/app/types/vehicle";
import { useState } from "react";
import toast from "react-hot-toast";

interface VehicleStatusCardProps {
  sno: number;
  tokenNo?: string;
  vehicleNo?: string;
  status: string;
  vehicle: Vehicle;
  onClick?: () => void;
}

export default function VehicleStatusCard({
  sno,
  tokenNo,
  vehicleNo,
  status,
  vehicle,
  onClick,
}: VehicleStatusCardProps) {
  const [copied, setCopied] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);

  const statusStyles: Record<string, string> = {
    WAITING_FOR_DETAILS:
      "bg-red-100 text-red-700",

    ENTRY_DONE:
      "bg-blue-100 text-blue-700",

    LOADING_STARTED:
      "bg-orange-100 text-orange-700",

    LOADING_DONE:
      "bg-purple-100 text-purple-700",

    LOADING_SLIP_SENT:
      "bg-indigo-100 text-indigo-700",

    ETP_DONE:
      "bg-yellow-100 text-yellow-700",

    ETP_INVOICE_DONE:
      "bg-cyan-100 text-cyan-700",

    DISPATCH_DONE:
      "bg-green-100 text-green-700",
  };

  const copyVehicleNo = async () => {
    if (!vehicleNo) return;

    await navigator.clipboard.writeText(vehicleNo);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  const sendToGoogleChat = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    // Don't trigger card onClick
    e.stopPropagation();

    if (!vehicle.vehicleNo) {
      toast.error("Vehicle number is missing");
      return;
    }

    if (!vehicle.status) {
      toast.error("Vehicle status is missing");
      return;
    }

    try {
      setSendingChat(true);

      const response = await fetch(
        "/api/google-chat/vehicle",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vehicleNumber: vehicle.vehicleNo,
            status: vehicle.status,
            transporter: vehicle.transporterName,
            driverName: vehicle.driverName,
            driverMobile: vehicle.driverContact,
            location: vehicle.destination,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Failed to send Google Chat message",
        );
      }

      toast.success(
        "Vehicle update sent to Google Chat",
      );
    } catch (error) {
      console.error(
        "Google Chat notification error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send Google Chat message",
      );
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Top Accent */}
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-orange-500 to-orange-300" />

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          S.No: {sno}
        </span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status] ||
            "bg-gray-100 text-gray-700"
            }`}
        >
          {status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="space-y-3">

        {/* Token */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Token No
          </p>

          <p className="text-lg font-bold text-gray-900">
            {tokenNo || "-"}
          </p>
        </div>

        {/* Vehicle */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Vehicle No
          </p>

          <div className="flex items-center justify-between gap-2">
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
                className="cursor-pointer rounded-md px-1.5 text-gray-500 transition hover:bg-orange-50 hover:text-orange-600"
                title="Copy Vehicle No"
              >
                {copied ? (
                  <span className="text-[11px] font-semibold text-green-600">
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
                      d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0 2 2v8a2 2 0 0 0 2"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Google Chat Button */}
        <button
          type="button"
          onClick={sendToGoogleChat}
          disabled={sendingChat}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sendingChat ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />

                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>

              Sending...
            </>
          ) : (
            <>
              💬
              Update in Google Chat
            </>
          )}
        </button>

      </div>
    </div>
  );
}