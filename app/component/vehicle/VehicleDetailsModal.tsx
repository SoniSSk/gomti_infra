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

export default function VehicleDetailsModal({
  vehicle,
  onClose,
}: VehicleDetailsModalProps) {
  if (!vehicle) return null;

  const details = [
    { label: "S.No", value: vehicle.sno },
    { label: "Date & Time", value: formatDate(vehicle.dateTime) },
    { label: "Vehicle Number", value: vehicle.vehicleNo },
    { label: "Token No", value: vehicle.tokenNo },
    { label: "Driver Name", value: vehicle.driverName },
    { label: "Driver Contact", value: vehicle.driverContact },
    { label: "Transporter Name", value: vehicle.transporterName },
    { label: "Buyer Details", value: vehicle.buyerDetails },
    { label: "Material Name", value: vehicle.materialName },
    { label: "Material Grade", value: vehicle.materialGrade },
    { label: "Destination", value: vehicle.destination },
    { label: "Net Weight", value: vehicle.netWeight },
    { label: "Invoice Number", value: vehicle.invoiceNo },
    { label: "Status", value: vehicle.status },
    { label: "Weight Slip", value: vehicle.weighmentSlip },
    { label: "Invoice", value: vehicle.invoiceImage },
    { label: "E Way Bill", value: vehicle.ewayBill },
    { label: "ETP", value: vehicle.etp },
  ];

  const renderImage = [
    { label: "Weight Slip", value: vehicle.weighmentSlip },
    { label: "Invoice", value: vehicle.invoiceImage },
    { label: "E Way Bill", value: vehicle.ewayBill },
    { label: "ETP", value: vehicle.etp },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="flex h-screen items-center justify-center p-4">
        <div className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white p-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Vehicle Details
              </h2>
              <p className="text-sm text-gray-500">
                Complete dispatch information
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
            >
              Close
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2  lg:grid-cols-3">
              {details.map((item) => (
                <DetailItem
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              {renderImage.map((item) => (
                <FilePreview
                  key={item.label}
                  url={item.value}
                  label={item.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
