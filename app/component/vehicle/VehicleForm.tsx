"use client";

import { useState } from "react";

interface VehicleFormProps {
  onSuccess: () => void;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

export default function VehicleForm({ onSuccess }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    vehicleNo: "",
    tokenNo: "",
    driverName: "",
    driverContact: "",
    transporterName: "",
    buyerDetails: "",
    materialName: "",
    materialGrade: "",
    destination: "",
    invoiceNo: "",
    netWeight: "",
    status: "WAITING_FOR_DETAILS",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sno: Date.now(),
          dateTime: new Date().toISOString(),
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save vehicle");
      }

      setFormData({
        vehicleNo: "",
        tokenNo: "",
        driverName: "",
        driverContact: "",
        transporterName: "",
        buyerDetails: "",
        materialName: "",
        materialGrade: "",
        destination: "",
        invoiceNo: "",
        netWeight: "",
        status: "WAITING_FOR_DETAILS",
      });

      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to save vehicle");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-2xl">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Vehicle Entry Form</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Vehicle Number */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Vehicle Number *
          </label>
          <input
            name="vehicleNo"
            value={formData.vehicleNo}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>

        {/* Token Number */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Token Number
          </label>
          <input
            name="tokenNo"
            value={formData.tokenNo}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Driver Name */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Driver Name
          </label>
          <input
            name="driverName"
            value={formData.driverName}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Driver Contact */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Driver Contact
          </label>
          <input
            name="driverContact"
            value={formData.driverContact}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Transporter Name */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Transporter Name
          </label>
          <input
            name="transporterName"
            value={formData.transporterName}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Buyer Details */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Buyer Details
          </label>
          <input
            name="buyerDetails"
            value={formData.buyerDetails}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Material Name */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Material Name
          </label>
          <input
            name="materialName"
            value={formData.materialName}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Material Grade */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Material Grade
          </label>
          <input
            name="materialGrade"
            value={formData.materialGrade}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Destination */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Destination
          </label>
          <input
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Invoice Number */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Invoice Number
          </label>
          <input
            name="invoiceNo"
            value={formData.invoiceNo}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Net Weight */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Net Weight (MT)
          </label>
          <input
            type="number"
            name="netWeight"
            value={formData.netWeight}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Status */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Status
          </label>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="WAITING_FOR_DETAILS">Waiting For Details</option>
            <option value="ENTRY_DONE">Entry Done</option>
            <option value="WAITING_FOR_TOKEN">Waiting For Token</option>
            <option value="LOADING_STARTED">Loading Started</option>
            <option value="LOADING_DONE">Loading Done</option>
            <option value="LOADING_SLIP_SENT">Loading Slip Sent</option>
            <option value="ETP_INVOICE_DONE">ETP Invoice Done</option>
            <option value="DISPATCH_DONE">Dispatch Done</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          className="
            rounded-lg
            bg-orange-600
            px-8
            py-3
            font-medium
            text-white
            shadow-md
            transition-all
            duration-200
            hover:bg-orange-700
            hover:shadow-lg
            active:scale-95
          "
        >
          Save Vehicle
        </button>
      </div>
    </form>
  );
}
