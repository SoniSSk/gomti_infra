"use client";

import React, { useState } from "react";
import { Vehicle } from "../../types/vehicle";

interface VehicleDetailsModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
}

const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div className="rounded-xl border bg-gray-50 p-4">
    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p className="break-words font-semibold text-gray-800">{value || "-"}</p>
  </div>
);

export default function VehicleDetailsModal({
  vehicle,
  onClose,
}: VehicleDetailsModalProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  if (!vehicle) return null;

  const weighmentSlip = (vehicle as any)?.weighmentSlip;

  const isPdf =
    weighmentSlip &&
    (weighmentSlip.toLowerCase().includes(".pdf") ||
      weighmentSlip.includes("/raw/upload/"));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 ">
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
          <div
            className="flex-1  "
            style={{
              overflow: "scroll",
              height: "600px",
            }}
          >
            {/* Vehicle Details */}
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="S.No" value={vehicle.sno} />
              <DetailItem label="Date & Time" value={vehicle.dateTime} />
              <DetailItem label="Vehicle Number" value={vehicle.vehicleNo} />
              <DetailItem label="Driver Name" value={vehicle.driverName} />
              <DetailItem
                label="Driver Contact"
                value={vehicle.driverContact}
              />
              <DetailItem
                label="Transporter Name"
                value={vehicle.transporterName}
              />
              <DetailItem label="Buyer Details" value={vehicle.buyerDetails} />
              <DetailItem label="Material Name" value={vehicle.materialName} />
              <DetailItem
                label="Material Grade"
                value={vehicle.materialGrade}
              />
              <DetailItem label="Destination" value={vehicle.destination} />
              <DetailItem label="Net Weight" value={vehicle.netWeight} />
              <DetailItem label="Invoice Number" value={vehicle.invoiceNo} />
              <DetailItem label="Status" value={vehicle.status} />

              {"tokenNo" in vehicle && (
                <DetailItem
                  label="Token Number"
                  value={(vehicle as any).tokenNo}
                />
              )}

              {"etpNo" in vehicle && (
                <DetailItem label="ETP Number" value={(vehicle as any).etpNo} />
              )}

              {"loadingSlipNo" in vehicle && (
                <DetailItem
                  label="Loading Slip No"
                  value={(vehicle as any).loadingSlipNo}
                />
              )}
            </div>

            {/* Weighment Slip */}
            {weighmentSlip && (
              <div className="border-t p-6">
                <h3 className="mb-4 text-xl font-bold text-gray-800">
                  Weighment Slip Preview
                </h3>

                <div className="overflow-hidden ">
                  {isPdf ? (
                    <iframe
                      src={weighmentSlip}
                      title="Weighment Slip"
                      className="h-[100px] w-full"
                    />
                  ) : (
                    <img
                      src={weighmentSlip}
                      alt="Weighment Slip"
                      className="max-h-[100px] w-full"
                      style={{
                        width: "200px",
                        height: "200px",
                      }}
                    />
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={weighmentSlip}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg w-20 h-20 bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                  >
                    Open Full Screen
                  </a>

                  <a
                    href={weighmentSlip}
                    download
                    className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                  >
                    Download
                  </a>
                </div>
              </div>
            )}

            {vehicle?.invoiceImage && (
              <div className="border-t p-6">
                <h3 className="mb-4 text-xl font-bold text-gray-800">
                  Invoice Slip Preview
                </h3>

                <div className="overflow-hidden ">
                  <iframe
                    src={vehicle?.invoiceImage}
                    title="Weighment Slip"
                    className="h-[100px] w-full"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={vehicle?.invoiceImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg w-20 h-20 bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                  >
                    Open Full Screen
                  </a>

                  <a
                    href={vehicle?.invoiceImage}
                    download
                    className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                  >
                    Download
                  </a>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex flex-wrap gap-3 border-t p-5">
              <button
                onClick={() => setShowEdit(true)}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Edit Vehicle
              </button>

              <button
                onClick={() => setShowStatus(true)}
                className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
              >
                Update Status
              </button>

              <button
                onClick={() => setShowPrint(true)}
                className="rounded-lg bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
              >
                Print Slip
              </button>
            </div>

            {/* Temporary Placeholders */}
            {showEdit && (
              <div className="p-5 text-center text-gray-500">
                Edit Modal Here
              </div>
            )}

            {showStatus && (
              <div className="p-5 text-center text-gray-500">
                Status Modal Here
              </div>
            )}

            {showPrint && (
              <div className="p-5 text-center text-gray-500">
                Print Modal Here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
