// components/common/VehicleStatusCard.tsx

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
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            statusStyles[status] || "bg-gray-100 text-gray-700"
          }`}
        >
          {status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Token No
          </p>
          <p className="text-lg font-bold text-gray-900">{tokenNo || "-"}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Vehicle No
          </p>
          <p className="text-lg font-bold text-orange-600 transition-transform duration-300 group-hover:scale-105">
            {vehicleNo || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
