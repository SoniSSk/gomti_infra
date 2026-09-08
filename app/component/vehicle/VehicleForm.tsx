/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAppDispatch } from "@/app/redux/hooks";
import { hideLoader, showLoader } from "@/app/redux/loaderSlice";
import { useState } from "react";
import toast from "react-hot-toast";

interface VehicleFormProps {
  onSuccess: () => void;
}

// =========================
// TRANSPORTERS
// =========================
const Transporteres = [
  "CLEAN AND GREEN",
  "VINAYAK ENTERPRISES",
  "SHRI GHANSHYAM LOGISTIC",
  "SHREE SARASWATI",
  "KRISHNA ROAD LINES",
  "VEER LOGISTICS",
  "VINAYAK ROADWAYS",
];

// =========================
// BUYERS
// =========================
const Buyeres = [
  "WELSPUN",
  "SHREE CEMENT",
  "VISHAL",
  "JSW",
  "NAVKAR MINERALS",
  "XYLE INDUSTRIES",
  "EVONITH",
];

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

export default function VehicleForm({ onSuccess }: VehicleFormProps) {
  const dispatch = useAppDispatch();

  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    vehicleNo: "",
    // tokenNo: "",
    // driverName: "",
    // driverContact: "",
    transporterName: "",
    buyerDetails: "",
    materialName: "",
    materialGrade: "",
    destination: "",
    // vehicleImage: "",
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      dispatch(showLoader());

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save vehicle");
      }

      setFormData({
        vehicleNo: "",
        // tokenNo: "",
        // driverName: "",
        // driverContact: "",
        transporterName: "",
        buyerDetails: "",
        materialName: "",
        materialGrade: "",
        destination: "",
        // vehicleImage: "",
        netWeight: "",
        status: "WAITING_FOR_DETAILS",
      });

      toast.success("Vehicle saved successfully");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save vehicle");
    } finally {
      setSubmitting(false);
      dispatch(hideLoader());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Vehicle Entry Form
        </h2>
      </div>

      {/* Form Fields */}
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
            placeholder="Enter vehicle number"
            required
          />
        </div>






        {/* ========================= */}
        {/* Transporter Dropdown */}
        {/* ========================= */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Transporter Name
          </label>

          <select
            name="transporterName"
            value={formData.transporterName}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select Transporter</option>

            {Transporteres.map((transporter) => (
              <option key={transporter} value={transporter}>
                {transporter}
              </option>
            ))}
          </select>
        </div>

        {/* ========================= */}
        {/* Buyer Dropdown */}
        {/* ========================= */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Buyer Details
          </label>

          <select
            name="buyerDetails"
            value={formData.buyerDetails}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select Buyer</option>

            {Buyeres.map((buyer) => (
              <option key={buyer} value={buyer}>
                {buyer}
              </option>
            ))}
          </select>
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
            placeholder="Enter material name"
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
            placeholder="Enter material grade"
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
            placeholder="Enter destination"
          />
        </div>

        {/* Net Weight */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Net Weight (MT)
          </label>

          <input
            type="number"
            step="0.01"
            name="netWeight"
            value={formData.netWeight}
            onChange={handleChange}
            className={inputClass}
            placeholder="Enter net weight"
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
            <option value="WAITING_FOR_DETAILS">
              Waiting For Details
            </option>
            <option value="ENTRY_DONE">Entry Done</option>
            <option value="LOADING_STARTED">Loading Started</option>
            <option value="LOADING_DONE">Loading Done</option>
            <option value="LOADING_SLIP_SENT">Loading Slip Sent</option>
            <option value="ETP_INVOICE_DONE">ETP Invoice Done</option>
            <option value="DISPATCH_DONE">Dispatch Done</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
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
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {submitting ? "Saving Vehicle..." : "Save Vehicle"}
        </button>
      </div>
    </form>
  );
}