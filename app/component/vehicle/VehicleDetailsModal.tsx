"use client";

import React from "react";
import { Vehicle } from "../../types/vehicle";
import DetailItem from "../common/DetailItem";
import { formatDate } from "@/app/utils/formatDate";
import FilePreview from "../common/FilePreview";

interface VehicleDetailsModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
}

// =========================
// FILE URL COMPONENT
// =========================

function FileUrl({ label, url }: { label: string; url?: string }) {
  if (!url) {
    return (
      <div className="mt-2 rounded-lg bg-gray-50 p-3">
        <p className="text-xs font-medium text-gray-500">{label} URL</p>

        <p className="mt-1 text-sm text-gray-400">Not available</p>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-semibold text-gray-600">{label} URL</p>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="
          mt-1
          block
          break-all
          text-xs
          text-blue-600
          underline
          hover:text-blue-800
        "
      >
        {url}
      </a>
    </div>
  );
}

export default function VehicleDetailsModal({
  vehicle,
  onClose,
}: VehicleDetailsModalProps) {
  if (!vehicle) return null;

  // =========================
  // VEHICLE DETAILS
  // =========================

  const details = [
    {
      label: "S.No",
      value: vehicle.sno,
    },
    {
      label: "Date & Time",
      value: formatDate(vehicle.dateTime),
    },
    {
      label: "Vehicle Number",
      value: vehicle.vehicleNo,
    },
    {
      label: "Token No",
      value: vehicle.tokenNo,
    },

    // Driver
    {
      label: "Driver Name",
      value: vehicle.driverName,
    },
    {
      label: "Driver Contact",
      value: vehicle.driverContact,
    },

    // Transporter / Buyer
    {
      label: "Transporter Name",
      value: vehicle.transporterName,
    },
    {
      label: "Buyer Details",
      value: vehicle.buyerDetails,
    },

    // Material
    {
      label: "Material Name",
      value: vehicle.materialName,
    },
    {
      label: "Material Grade",
      value: vehicle.materialGrade,
    },

    // Route
    {
      label: "Route",
      value: vehicle.route,
    },
    {
      label: "Destination",
      value: vehicle.destination,
    },

    // Vehicle
    {
      label: "Tyre",
      value: vehicle.tyre,
    },
    {
      label: "Net Weight",
      value: vehicle.netWeight,
    },

    // Time
    {
      label: "In Time",
      value: vehicle.inTime,
    },
    {
      label: "Out Time",
      value: vehicle.outTime,
    },

    // Status
    {
      label: "Status",
      value: vehicle.status,
    },

    // System
    {
      label: "Created At",
      value: formatDate(vehicle.createdAt),
    },
    {
      label: "Updated At",
      value: formatDate(vehicle.updatedAt),
    },
  ];

  // =========================
  // FILES
  // =========================

  const renderImage = [
    {
      label: "Vehicle Image",
      value: vehicle.vehicleImage,
    },
    {
      label: "Driver License",
      value: vehicle.driverLicenseImage,
    },
    {
      label: "Vehicle Registration / RC",
      value: vehicle.vehicleRegistrationImage,
    },
    {
      label: "Weight Slip",
      value: vehicle.weightSlip,
    },
    {
      label: "LR Slip",
      value: vehicle.LRSlip,
    },
    {
      label: "ETP",
      value: vehicle.etp,
    },
    {
      label: "Invoice",
      value: vehicle.invoiceImage,
    },
    {
      label: "E Way Bill",
      value: vehicle.EWayBill,
    },
    {
      label: "Loading Video",
      value: vehicle.loadingVideo,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      {/* ========================= */}
      {/* MODAL WRAPPER */}
      {/* ========================= */}

      <div className="flex h-[100dvh] w-full items-center justify-center sm:h-screen sm:p-4">
        {/* ========================= */}
        {/* MODAL */}
        {/* ========================= */}

        <div
          className="
            flex
            h-[100dvh]
            w-full
            flex-col
            overflow-hidden
            bg-white
            shadow-2xl

            sm:h-[90vh]
            sm:max-w-6xl
            sm:rounded-2xl
          "
        >
          {/* ========================= */}
          {/* HEADER */}
          {/* ========================= */}

          <div
            className="
              flex
              shrink-0
              items-center
              justify-between
              border-b
              bg-white
              p-4

              sm:p-5
            "
          >
            <div>
              <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
                Vehicle Details
              </h2>

              <p className="text-xs text-gray-500 sm:text-sm">
                Complete dispatch information
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="
                rounded-lg
                bg-red-500
                px-3
                py-2
                text-sm
                text-white
                transition
                hover:bg-red-600
                active:scale-95
cursor-pointer
                sm:px-4
                sm:text-base
              "
            >
              Close
            </button>
          </div>

          {/* ========================= */}
          {/* SCROLLABLE BODY */}
          {/* ========================= */}

          <div
            className="
              min-h-0
              flex-1
              overflow-y-auto
              overscroll-contain
            "
          >
            {/* ========================= */}
            {/* VEHICLE INFORMATION */}
            {/* ========================= */}

            <div
              className="
                grid
                grid-cols-1
                gap-3
                p-4

                sm:grid-cols-2
                sm:gap-4
                sm:p-6

                lg:grid-cols-3
              "
            >
              {details.map((item) => (
                <DetailItem
                  copyValue={item.value}
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>

            {/* ========================= */}
            {/* FILE PREVIEWS + URL */}
            {/* ========================= */}

            <div
              className="
                grid
                grid-cols-1
                gap-5
                px-4
                pb-8

                sm:grid-cols-2
                sm:px-6
              "
            >
              {renderImage.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-200 p-3"
                >
                  {/* Preview */}
                  <FilePreview
                    key={item.label}
                    url={item.value}
                    label={item.label}
                  />

                  {/* URL */}
                  <FileUrl label={item.label} url={item.value} />
                </div>
              ))}
            </div>

            {/* Bottom spacing */}
            <div className="h-4 sm:h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
