"use client";

import { useCloudinaryUpload } from "@/app/hooks/useCloudinaryUpload";
import { useEffect, useState } from "react";
import { Vehicle } from "../../types/vehicle";
import { useCloudinaryPdfUpload } from "@/app/hooks/useCloudinaryPdfUpload";
import UploadImage from "../common/UploadImage";

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
  const [loading, setLoading] = useState(false);

  const { openUploads } = useCloudinaryPdfUpload();

  const handleUploadPDF = async () => {
    try {
      const url = await openUploads();

      setFormData((prev) => ({
        ...prev,
        invoiceImage: url,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadETP = async () => {
    try {
      const url = await openUploads();

      setFormData((prev) => ({
        ...prev,
        etp: url,
      }));
    } catch (error) {
      console.error(error);
    }
  };
  const handleUploadEWayBill = async () => {
    try {
      const url = await openUploads();

      setFormData((prev) => ({
        ...prev,
        ewayBill: url,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const { openUpload } = useCloudinaryUpload();

  const handleUpload = async () => {
    try {
      const url = await openUpload();

      console.log("Uploaded:", url);

      setFormData((prev) => ({
        ...prev,
        weighmentSlip: url,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (vehicle) {
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

  const aa = (({ _id, createdAt, updatedAt, ...rest }) => rest)(formData);
  console.log(formData, "formData");

  const handleUpdate = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/vehicles/${formData.sno}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(aa),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      onSuccess?.();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-7xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
          <h2 className="text-xl font-bold">Edit Vehicle #{vehicle.sno}</h2>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
        {/* Form */}
        <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
          <input
            name="vehicleNo"
            placeholder="Vehicle Number"
            value={formData.vehicleNo || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />

          <input
            name="tokenNo"
            placeholder="Token Number"
            value={formData.tokenNo || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="driverName"
            placeholder="Driver Name"
            value={formData.driverName || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="driverContact"
            placeholder="Driver Contact"
            value={formData.driverContact || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="transporterName"
            placeholder="Transporter Name"
            value={formData.transporterName || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="buyerDetails"
            placeholder="Buyer Details"
            value={formData.buyerDetails || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="materialName"
            placeholder="Material Name"
            value={formData.materialName || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="materialGrade"
            placeholder="Material Grade"
            value={formData.materialGrade || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="destination"
            placeholder="Destination"
            value={formData.destination || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="invoiceNo"
            placeholder="Invoice No"
            value={formData.invoiceNo || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="netWeight"
            placeholder="Net Weight"
            value={formData.netWeight || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="weighmentSlip"
            placeholder="Weighment Slip"
            value={formData.weighmentSlip || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="builtyNo"
            placeholder="Builty No"
            value={formData.builtyNo || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="etp"
            placeholder="ETP"
            value={formData.etp || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="invoiceImage"
            placeholder="Invoice Image"
            value={formData.invoiceImage || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <input
            name="ewayBill"
            placeholder="E-Way Bill"
            value={formData.ewayBill || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          />
          <select
            name="status"
            value={formData.status || ""}
            onChange={handleChange}
            className="rounded-lg border p-3"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <UploadImage />
        <div
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 cursor-pointer"
          onClick={() => handleUpload()}
        >
          Upload Weight Slip
        </div>
        <div
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 cursor-pointer"
          onClick={() => handleUploadPDF()}
        >
          Upload Invoice
        </div>
        <div
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 cursor-pointer"
          onClick={() => handleUploadEWayBill()}
        >
          Upload E-Way Bill
        </div>{" "}
        <div
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 cursor-pointer"
          onClick={() => handleUploadETP()}
        >
          Upload ETP
        </div>{" "}
        {/* Footer */}
        <div className="sticky bottom-0 flex justify-between border-t bg-white p-4">
          <button
            onClick={() => {}}
            disabled={loading}
            className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
          >
            Delete Vehicle
          </button>

          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-lg border px-5 py-2">
              Cancel
            </button>

            <button
              onClick={handleUpdate}
              disabled={loading}
              className="rounded-lg bg-orange-600 px-5 py-2 text-black hover:bg-orange-700"
            >
              {loading ? "Updating..." : "Update Vehicle"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
