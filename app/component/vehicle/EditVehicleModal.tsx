"use client";

import { useEffect, useState } from "react";
import { Vehicle } from "../../types/vehicle";
import { FormField } from "../common/FormField";
import { useAppDispatch } from "@/app/redux/hooks";
import { hideLoader, showLoader } from "@/app/redux/loaderSlice";
import FileUpload from "../common/FileUpload";

interface EditVehicleModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditVehicleModal({
  vehicle,
  onClose,
  onSuccess,
}: EditVehicleModalProps) {
  const [formData, setFormData] = useState<Partial<Vehicle>>({});

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (vehicle) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(vehicle);
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (field: keyof Vehicle, url: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: url,
    }));
  };

  const handleUpdate = async () => {
    try {
      dispatch(showLoader());

      const payload = { ...formData };

      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;

      const response = await fetch(`/api/vehicles/${formData.sno}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update vehicle");
      }

      alert("Vehicle updated successfully");

      onSuccess();
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error.message || "Failed to update vehicle");
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleDelete = async (sno: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this vehicle?",
    );

    if (!confirmDelete) return;

    try {
      dispatch(showLoader());

      const response = await fetch(`/api/vehicles/${sno}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete vehicle");
      }

      alert("Vehicle deleted successfully");

      onSuccess();
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error.message || "Failed to delete vehicle");
    } finally {
      dispatch(hideLoader());
    }
  };

  const statuses = [
    "WAITING_FOR_DETAILS",
    "ENTRY_DONE",
    "WAITING_FOR_TOKEN",
    "LOADING_STARTED",
    "LOADING_DONE",
    "LOADING_SLIP_SENT",
    "ETP_INVOICE_DONE",
    "DISPATCH_DONE",
  ];

  const fields = [
    { name: "vehicleNo", label: "Vehicle Number" },
    { name: "tokenNo", label: "Token Number" },
    { name: "driverName", label: "Driver Name" },
    { name: "driverContact", label: "Driver Contact" },
    { name: "transporterName", label: "Transporter Name" },
    { name: "buyerDetails", label: "Buyer Details" },
    { name: "materialName", label: "Material Name" },
    { name: "materialGrade", label: "Material Grade" },
    { name: "destination", label: "Destination" },
    { name: "netWeight", label: "Net Weight" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-7xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
          <h2 className="text-xl font-bold">Edit Vehicle #{vehicle.sno}</h2>

          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg px-3 py-2 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Form Fields */}
        <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <FormField
              key={field.name}
              label={field.label}
              name={field.name}
              value={String(formData[field.name as keyof Vehicle] || "")}
              onChange={handleChange}
            />
          ))}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Status</label>

            <select
              name="status"
              value={formData.status || ""}
              onChange={handleChange}
              className="rounded-lg border border-gray-300 p-3"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* File Uploads */}
        <div className="grid grid-cols-1 gap-4 px-6 pb-6 md:grid-cols-2 lg:grid-cols-3">
          <FileUpload
            url={formData.weightSlip}
            label="Weight Slip"
            onUpload={(url) => handleFileUpload("weightSlip", url)}
          />

          <FileUpload
            url={formData.invoiceImage}
            label="Invoice"
            onUpload={(url) => handleFileUpload("invoiceImage", url)}
          />

          <FileUpload
            url={formData.EWayBill}
            label="E-Way Bill"
            onUpload={(url) => handleFileUpload("EWayBill", url)}
          />

          <FileUpload
            url={formData.etp}
            label="ETP"
            onUpload={(url) => handleFileUpload("etp", url)}
          />

          <FileUpload
            url={formData.LRSlip}
            label="LR Slip"
            onUpload={(url) => handleFileUpload("LRSlip", url)}
          />

          <FileUpload
            url={formData.vehicleImage}
            label="Vehicle Number Plate"
            onUpload={(url) => handleFileUpload("vehicleImage", url)}
          />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-between border-t bg-white p-4">
          <button
            onClick={() => handleDelete(Number(formData.sno))}
            disabled={formData.status !== "ENTRY_DONE"}
            className={`rounded-lg px-5 py-2 text-white transition ${
              formData.status === "ENTRY_DONE"
                ? "bg-red-600 hover:bg-red-700"
                : "cursor-not-allowed bg-gray-400"
            }`}
          >
            Delete Vehicle
          </button>

          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-lg border px-5 py-2">
              Cancel
            </button>

            <button
              onClick={handleUpdate}
              className="cursor-pointer rounded-lg bg-orange-600 px-5 py-2 text-white hover:bg-orange-700"
            >
              Update Vehicle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
