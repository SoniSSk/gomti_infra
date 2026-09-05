"use client";

import { useEffect, useState } from "react";
import { Vehicle } from "../../types/vehicle";
import { FormField } from "../common/FormField";
import { useAppDispatch } from "@/app/redux/hooks";
import { hideLoader, showLoader } from "@/app/redux/loaderSlice";
import FileUpload from "../common/FileUpload";
import toast from "react-hot-toast";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (vehicle) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(vehicle);
    }
  }, [vehicle]);

  if (!vehicle) return null;

  // =========================
  // INPUT CHANGE
  // =========================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // FILE UPLOAD
  // =========================
  const handleFileUpload = (
    field: keyof Vehicle,
    url: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: url,
    }));
  };

  // =========================
  // UPDATE VEHICLE
  // =========================
  const handleUpdate = async () => {
    try {
      dispatch(showLoader());

      const payload = { ...formData };

      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;

      const response = await fetch(
        `/api/vehicles/${formData.sno}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update vehicle",
        );
      }

      toast.success("Vehicle updated successfully");

      onSuccess();
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(
        error.message || "Failed to update vehicle",
      );
    } finally {
      dispatch(hideLoader());
    }
  };

  // =========================
  // DELETE VEHICLE
  // =========================
  const handleDelete = async (sno: number) => {
    try {
      setDeleteLoading(true);
      dispatch(showLoader());

      const response = await fetch(
        `/api/vehicles/${sno}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete vehicle",
        );
      }

      toast.success("Vehicle deleted successfully");

      setShowDeleteConfirm(false);

      onSuccess();
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(
        error.message || "Failed to delete vehicle",
      );
    } finally {
      setDeleteLoading(false);
      dispatch(hideLoader());
    }
  };

  // =========================
  // STATUS
  // =========================
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
  ];

  // =========================
  // BUYERS
  // =========================
  const Buyeres = [
    "WELSPUN CORPORATION LIMITED",
    "SHREE CEMENT LIMITED",
    "VISHAL METAL & MINING LIMITED",
    "JSW",
    "NAVKAR MINERALS",
    "XYLE INDUSTRIES",
    "EVONITH",
  ];

  // =========================
  // FORM FIELDS
  // =========================
  const fields = [
    {
      name: "vehicleNo",
      label: "Vehicle Number",
    },
    {
      name: "tokenNo",
      label: "Token Number",
    },
    {
      name: "driverName",
      label: "Driver Name",
    },
    {
      name: "driverContact",
      label: "Driver Contact",
    },
    {
      name: "materialName",
      label: "Material Name",
    },
    {
      name: "materialGrade",
      label: "Material Grade",
    },
    {
      name: "destination",
      label: "Destination",
    },
    {
      name: "netWeight",
      label: "Net Weight",
    },
  ];

  return (
    <>
      {/* =====================================
          MAIN EDIT VEHICLE MODAL
      ===================================== */}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-7xl overflow-y-auto rounded-xl bg-white shadow-2xl">

          {/* HEADER */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
            <h2 className="text-xl font-bold">
              Edit Vehicle #{vehicle.vehicleNo}
            </h2>

            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg px-3 py-2 text-xl hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          {/* FORM FIELDS */}
          <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">

            {fields.map((field) => (
              <FormField
                key={field.name}
                label={field.label}
                name={field.name}
                value={String(
                  formData[
                  field.name as keyof Vehicle
                  ] || "",
                )}
                onChange={handleChange}
              />
            ))}

            {/* BUYER */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Buyer Name
              </label>

              <select
                name="buyerDetails"
                value={formData.buyerDetails || ""}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 p-3"
              >
                <option value="">
                  Select Buyer
                </option>

                {Buyeres.map((buyer) => (
                  <option
                    key={buyer}
                    value={buyer}
                  >
                    {buyer}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                name="status"
                value={formData.status || ""}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 p-3"
              >
                <option value="">
                  Select Status
                </option>

                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* TRANSPORTER */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Transporter Name
              </label>

              <select
                name="transporterName"
                value={formData.transporterName || ""}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 p-3"
              >
                <option value="">
                  Select Transporter
                </option>

                {Transporteres.map((transporter) => (
                  <option
                    key={transporter}
                    value={transporter}
                  >
                    {transporter}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =====================================
              FILE UPLOADS
          ===================================== */}

          <div className="grid grid-cols-1 gap-4 px-6 pb-6 md:grid-cols-2 lg:grid-cols-3">

            <FileUpload
              url={formData.weightSlip}
              label="Weight Slip"
              onUpload={(url) =>
                handleFileUpload(
                  "weightSlip",
                  url,
                )
              }
            />

            <FileUpload
              url={formData.invoiceImage}
              label="Invoice"
              onUpload={(url) =>
                handleFileUpload(
                  "invoiceImage",
                  url,
                )
              }
            />

            <FileUpload
              url={formData.EWayBill}
              label="E-Way Bill"
              onUpload={(url) =>
                handleFileUpload(
                  "EWayBill",
                  url,
                )
              }
            />

            <FileUpload
              url={formData.etp}
              label="ETP"
              onUpload={(url) =>
                handleFileUpload(
                  "etp",
                  url,
                )
              }
            />

            <FileUpload
              url={formData.LRSlip}
              label="LR Slip"
              onUpload={(url) =>
                handleFileUpload(
                  "LRSlip",
                  url,
                )
              }
            />

            <FileUpload
              url={formData.vehicleImage}
              label="Vehicle Number Plate"
              onUpload={(url) =>
                handleFileUpload(
                  "vehicleImage",
                  url,
                )
              }
            />

            {/* LOADING VIDEO */}
            <FileUpload
              url={formData.loadingVideo}
              label="Loading Video"
              onUpload={(url) =>
                handleFileUpload(
                  "loadingVideo",
                  url,
                )
              }
            />
          </div>

          {/* =====================================
              FOOTER
          ===================================== */}

          <div className="sticky bottom-0 z-10 flex justify-between border-t bg-white p-4">

            {/* DELETE */}
            <button
              onClick={() =>
                setShowDeleteConfirm(true)
              }
              disabled={
                formData.status !==
                "WAITING_FOR_DETAILS"
              }
              className={`rounded-lg px-5 py-2 text-white transition ${formData.status ===
                "WAITING_FOR_DETAILS"
                ? "bg-red-600 hover:bg-red-700"
                : "cursor-not-allowed bg-gray-400"
                }`}
            >
              Delete Vehicle
            </button>

            {/* RIGHT BUTTONS */}
            <div className="flex gap-3">

              <button
                onClick={onClose}
                className="rounded-lg border px-5 py-2 hover:bg-gray-100"
              >
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

      {/* =====================================
          DELETE CONFIRMATION MODAL
      ===================================== */}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            {/* WARNING ICON */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <span className="text-2xl">
                ⚠️
              </span>
            </div>

            {/* TITLE */}
            <h3 className="text-center text-xl font-bold text-gray-800">
              Delete Vehicle?
            </h3>

            {/* MESSAGE */}
            <p className="mt-2 text-center text-sm text-gray-500">
              Are you sure you want to delete
              vehicle{" "}
              <span className="font-semibold text-gray-700">
                {vehicle.vehicleNo}
              </span>
              ?
              <br />
              This action cannot be undone.
            </p>

            {/* BUTTONS */}
            <div className="mt-6 flex justify-center gap-3">

              <button
                type="button"
                onClick={() =>
                  setShowDeleteConfirm(false)
                }
                disabled={deleteLoading}
                className="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDelete(
                    Number(formData.sno),
                  )
                }
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-6 py-2.5 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}