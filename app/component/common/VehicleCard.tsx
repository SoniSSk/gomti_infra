import React from "react";
import { Vehicle } from "../../types/vehicle";

interface VehicleCardProps {
  data: Vehicle;
}

const statusColors: Record<string, string> = {
  WAITING_FOR_DETAILS: "bg-red-100 text-red-700",
  ENTRY_DONE: "bg-blue-100 text-blue-700",
  WAITING_FOR_TOKEN: "bg-yellow-100 text-yellow-700",
  LOADING_STARTED: "bg-orange-100 text-orange-700",
  LOADING_DONE: "bg-purple-100 text-purple-700",
  LOADING_SLIP_SENT: "bg-indigo-100 text-indigo-700",
  ETP_INVOICE_DONE: "bg-cyan-100 text-cyan-700",
  DISPATCH_DONE: "bg-green-100 text-green-700",
};

export default function VehicleCard({ data }: VehicleCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">{data.vehicleNo}</h2>
          <p className="text-sm text-gray-500">{data.dateTime}</p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            statusColors[data.status]
          }`}
        >
          {data.status.replaceAll("_", " ")}
        </span>
      </div>

      {/* Vehicle Details */}
      <div>
        <h3 className="font-semibold text-orange-600 mb-3">Vehicle Details</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <Info label="Driver Name" value={data.driverName} />
          <Info label="Driver Contact" value={data.driverContact} />
          <Info label="Transporter" value={data.transporterName} />
          <Info label="Buyer" value={data.buyerDetails} />
        </div>
      </div>

      {/* Material Details */}
      <div>
        <h3 className="font-semibold text-orange-600 mb-3">Material Details</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <Info label="Material" value={data.materialName} />
          <Info label="Grade" value={data.materialGrade} />
          <Info label="Destination" value={data.destination} />
          <Info label="Net Weight" value={data.netWeight} />
          <Info label="LR Slip" value={data.LRSlip} />
        </div>
      </div>

      {/* Documents */}
      {(data.weightSlip || data.etp || data.invoiceImage || data.EWayBill) && (
        <div>
          <h3 className="font-semibold text-orange-600 mb-3">Documents</h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.weightSlip && (
              <DocumentCard title="Weight Slip" url={data.weightSlip} />
            )}

            {data.etp && <DocumentCard title="ETP" url={data.etp} />}

            {data.invoiceImage && (
              <DocumentCard title="Invoice" url={data.invoiceImage} />
            )}

            {data.EWayBill && (
              <DocumentCard title="E-Way Bill" url={data.EWayBill} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>

      <div className="border rounded-lg px-3 py-2 bg-gray-50 min-h-[44px]">
        {value || "-"}
      </div>
    </div>
  );
}

function DocumentCard({ title, url }: { title: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="border rounded-lg p-4 hover:border-orange-500 hover:bg-orange-50 transition"
    >
      <div className="font-medium">{title}</div>
      <div className="text-sm text-gray-500 mt-1">View Document</div>
    </a>
  );
}
