"use client";

import { useState } from "react";

interface VehicleFormProps {
  onSuccess: () => void;
}

export default function VehicleForm({ onSuccess }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    vehicleNo: "",
    driverName: "",
    driverContact: "",
    transporterName: "",
    buyerDetails: "",
    materialName: "",
    materialGrade: "",
    destination: "",
    invoiceNo: "",
    netWeight: "",
    status: "ENTRY_DONE",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
        driverName: "",
        driverContact: "",
        transporterName: "",
        buyerDetails: "",
        materialName: "",
        materialGrade: "",
        destination: "",
        invoiceNo: "",
        netWeight: "",
        status: "ENTRY_DONE",
      });

      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to save vehicle");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md mb-6"
    >
      <h2 className="text-xl font-bold mb-4">Vehicle Entry Form</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <input
          name="vehicleNo"
          value={formData.vehicleNo}
          onChange={handleChange}
          placeholder="Vehicle Number"
          className="border rounded px-3 py-2"
          required
        />

        <input
          name="driverName"
          value={formData.driverName}
          onChange={handleChange}
          placeholder="Driver Name"
          className="border rounded px-3 py-2"
        />

        <input
          name="driverContact"
          value={formData.driverContact}
          onChange={handleChange}
          placeholder="Driver Contact"
          className="border rounded px-3 py-2"
        />

        <input
          name="transporterName"
          value={formData.transporterName}
          onChange={handleChange}
          placeholder="Transporter Name"
          className="border rounded px-3 py-2"
        />

        <input
          name="buyerDetails"
          value={formData.buyerDetails}
          onChange={handleChange}
          placeholder="Buyer Details"
          className="border rounded px-3 py-2"
        />

        <input
          name="materialName"
          value={formData.materialName}
          onChange={handleChange}
          placeholder="Material Name"
          className="border rounded px-3 py-2"
        />

        <input
          name="materialGrade"
          value={formData.materialGrade}
          onChange={handleChange}
          placeholder="Material Grade"
          className="border rounded px-3 py-2"
        />

        <input
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          placeholder="Destination"
          className="border rounded px-3 py-2"
        />

        <input
          name="invoiceNo"
          value={formData.invoiceNo}
          onChange={handleChange}
          placeholder="Invoice Number"
          className="border rounded px-3 py-2"
        />

        <input
          type="number"
          name="netWeight"
          value={formData.netWeight}
          onChange={handleChange}
          placeholder="Net Weight (MT)"
          className="border rounded px-3 py-2"
        />

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="border rounded px-3 py-2"
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

      <button
        type="submit"
        className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded"
      >
        Save Vehicle
      </button>
    </form>
  );
}
