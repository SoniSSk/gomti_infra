/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Vehicle_new } from "@/app/types/vehicle_new";
import { normalizeVehicle } from "@/app/utils/vehicleMapper";
import {
    Clock,
    FileText,
    Lock,
    Package,
    Save,
    Trash2,
    TriangleAlert,
    Truck,
} from "lucide-react";

import CommonButton from "../common/CommonButton";
import CommonInput from "../common/CommonInput";
import CommonFileUpload from "../common/CommonFileUpload";
import CommonModal from "../common/CommonModal";
import { FIELD_CLASS, FormField, ModalSection } from "../common/ModalParts";
import { StatusBadge, formatStatus } from "../common/vehicleStatus";
import { canModifyVehicle, getStoredUserRole } from "@/app/utils/vehiclePermissions";

/* =============================================================
   TYPES
============================================================= */

interface EditVehicleModalProps {
    vehicle: Vehicle_new | null;
    onClose: () => void;
    isOpen: boolean;
    /**
     * Called with the complete edited vehicle object.
     * The parent should merge this complete object into its vehicle list.
     */
    onSuccess: (updatedVehicle?: Vehicle_new) => void;
}

type VehicleDocuments = NonNullable<Vehicle_new["documents"]>;
type DocumentField = keyof VehicleDocuments;
type TrackingEntry = NonNullable<Vehicle_new["tracking"]>[number];
type TrackingAction = TrackingEntry["action"];
type FieldChange = NonNullable<TrackingEntry["changes"]>[number];

/* =============================================================
   OPTIONS
============================================================= */

const STATUSES = [
    "WAITING_FOR_DETAILS",
    "ENTRY_DONE",
    "WAITING_FOR_TOKEN",
    "LOADING_STARTED",
    "LOADING_DONE",
    "LOADING_SLIP_SENT",
    "ON_HOLD",
    "NOT_REGISTERED",
    "ETP_GENERATING",
    "ETP_DONE",
    "INVOICE_GENERATING",
    "ETP_INVOICE_DONE",
    "DISPATCH_DONE",
];

const BUYERS = [
    "WELSPUN",
    "SHREE CEMENT",
    "VISHAL",
    "JSW",
    "NAVKAR MINERALS",
    "XYLE INDUSTRIES",
    "EVONITH",
];

const TRANSPORTERS = [
    "CLEAN AND GREEN",
    "VINAYAK ENTERPRISES",
    "SHRI GHANSHYAM LOGISTIC",
    "SHREE SARASWATI",
    "KRISHNA ROAD LINES",
    "VEER LOGISTICS",
    "VINAYAK ROADWAYS",
    "LAXMI TRANSPORT CORPORATION",
];

const TYRE_OPTIONS = [
    "4 Tyre",
    "6 Tyre",
    "8 Tyre",
    "10 Tyre",
    "12 Tyre",
    "14 Tyre",
    "16 Tyre",
    "18 Tyre",
    "22 Tyre",
];

/*
 * Keep these names exactly the same as Vehicle_new.documents.
 * Order here is the order of the upload tiles.
 */
const DOCUMENT_UPLOADS: {
    field: DocumentField;
    label: string;
    adminOnly?: boolean;
}[] = [
    { field: "vehicleImage", label: "Vehicle Image" },
    { field: "vehicleRegistrationImage", label: "Vehicle Registration" },
    { field: "driverLicenseImage", label: "Driver License" },
    { field: "weightSlip", label: "Weight Slip" },
    { field: "LRSlip", label: "LR Slip" },
    { field: "etp", label: "ETP", adminOnly: true },
    { field: "invoiceImage", label: "Invoice", adminOnly: true },
    { field: "EWayBill", label: "E-Way Bill", adminOnly: true },
    { field: "loadingVideo", label: "Loading Video", adminOnly: true },
];

const DOCUMENT_FIELDS = DOCUMENT_UPLOADS.map(({ field }) => field);

/* Fields compared for the tracking "changes" list. */
const TRACKED_FIELDS: (keyof Vehicle_new)[] = [
    "vehicleNo",
    "driverName",
    "transporterName",
    "tyre",
    "route",
    "buyerDetails",
    "materialName",
    "materialGrade",
    "netWeight",
    "status",
    "holdReason",
    "inTime",
    "outTime",
    "destination",
    "tokenNo",
    "driverContact",
    "etpNo",
    "etpDate",
];

const STATUS_TRACKING_ACTIONS: Partial<Record<string, TrackingAction>> = {
    LOADING_STARTED: "LOADING_STARTED",
    LOADING_DONE: "LOADING_COMPLETED",
    ETP_DONE: "ETP_GENERATED",
    ETP_INVOICE_DONE: "INVOICE_GENERATED",
    DISPATCH_DONE: "DISPATCHED",
};

/* =============================================================
   HELPERS
============================================================= */

const isChanged = (a: unknown, b: unknown) =>
    JSON.stringify(a) !== JSON.stringify(b);

/* Always returns every document key so the PUT body is complete. */
const pickDocuments = (documents?: VehicleDocuments): VehicleDocuments =>
    Object.fromEntries(
        DOCUMENT_FIELDS.map((field) => [field, documents?.[field]]),
    ) as VehicleDocuments;

/* "DD-MM-YYYY HH:MM AM/PM" -> "YYYY-MM-DDTHH:MM" (datetime-local). */
const toDateTimeLocal = (value?: string) => {
    if (!value) return "";

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
        return value;
    }

    const match = value.match(
        /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})\s+(AM|PM)$/i,
    );

    if (!match) return "";

    const [, day, month, year, hour, minute, ampm] = match;
    const period = ampm.toUpperCase();

    let hour24 = Number(hour);

    if (period === "PM" && hour24 !== 12) hour24 += 12;
    if (period === "AM" && hour24 === 12) hour24 = 0;

    return `${year}-${month}-${day}T${String(hour24).padStart(2, "0")}:${minute}`;
};

/* "YYYY-MM-DDTHH:MM" -> "DD-MM-YYYY HH:MM AM/PM". */
const fromDateTimeLocal = (value: string) => {
    if (!value) return "";

    const [date, time] = value.split("T");

    if (!date || !time) {
        return value;
    }

    const [year, month, day] = date.split("-");
    const [hour, minute] = time.split(":");

    let hourNumber = Number(hour);
    const ampm = hourNumber >= 12 ? "PM" : "AM";

    if (hourNumber === 0) {
        hourNumber = 12;
    } else if (hourNumber > 12) {
        hourNumber -= 12;
    }

    return `${day}-${month}-${year} ${String(hourNumber).padStart(2, "0")}:${minute} ${ampm}`;
};

const getCurrentUser = (): NonNullable<Vehicle_new["updatedBy"]> => {
    if (typeof window === "undefined") {
        return { name: "Unknown User" };
    }

    const id = localStorage.getItem("userId") || undefined;
    const email = localStorage.getItem("userEmail") || undefined;
    const role = localStorage.getItem("userRole") || undefined;
    const name =
        localStorage.getItem("userName") ||
        localStorage.getItem("name") ||
        "Unknown User";

    return {
        ...(id ? { id } : {}),
        name,
        ...(email ? { email } : {}),
        ...(role ? { role } : {}),
    };
};

/* Returns an error message, or null when the form can be saved. */
const validateForm = (formData: Partial<Vehicle_new>): string | null => {
    switch (formData.status) {
        case "ENTRY_DONE":
            if (!formData.tokenNo?.trim()) {
                return "Token Number is mandatory when status is Entry Done";
            }
            if (!formData.inTime?.trim()) {
                return "In Time is mandatory when status is Entry Done";
            }
            return null;

        case "ON_HOLD":
            if (!formData.holdReason?.trim()) {
                return "Reason is mandatory when status is On Hold";
            }
            return null;

        case "DISPATCH_DONE":
            if (!formData.outTime?.trim()) {
                return "Out Time is mandatory when status is Dispatch Done";
            }
            return null;

        default:
            return null;
    }
};

const getTrackingAction = (
    statusChanged: boolean,
    newStatus: string | undefined,
    oldDocuments: VehicleDocuments,
    newDocuments: VehicleDocuments,
): TrackingAction => {
    if (statusChanged) {
        return STATUS_TRACKING_ACTIONS[newStatus ?? ""] ?? "STATUS_CHANGED";
    }

    const documentChanged = DOCUMENT_FIELDS.some((field) =>
        isChanged(oldDocuments[field], newDocuments[field]),
    );

    if (!documentChanged) {
        return "DETAILS_UPDATED";
    }

    if (DOCUMENT_FIELDS.some((f) => oldDocuments[f] && !newDocuments[f])) {
        return "DOCUMENT_REMOVED";
    }

    if (DOCUMENT_FIELDS.some((f) => !oldDocuments[f] && newDocuments[f])) {
        return "DOCUMENT_UPLOADED";
    }

    return "DOCUMENT_UPDATED";
};

/* =============================================================
   API CALLS
============================================================= */

/*
 * Called only after the vehicle PUT API succeeds.
 * The Google Chat webhook URL stays server-side.
 * A failure here must never make the vehicle update fail.
 */
const sendGoogleChatStatusUpdate = async (updatedVehicle: Vehicle_new) => {
    try {
        const response = await fetch("/api/google-chat/vehicle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                vehicleNumber: updatedVehicle.vehicleNo,
                status: updatedVehicle.status,
                transporter: updatedVehicle.transporterName,
                driverName: updatedVehicle.driverName,
                driverMobile: updatedVehicle.driverContact,
                location: updatedVehicle.destination,
            }),
        });

        // Read as text: a Next.js HTML error page is not valid JSON.
        if (!response.ok) {
            console.error(
                "Google Chat notification failed:",
                await response.text(),
            );
            return false;
        }

        return true;
    } catch (error) {
        console.error("Google Chat notification error:", error);
        return false;
    }
};

/* =============================================================
   COMPONENT
============================================================= */

export default function EditVehicleModal({
    vehicle,
    onClose,
    onSuccess,
    isOpen,
}: EditVehicleModalProps) {
    const [formData, setFormData] = useState<Partial<Vehicle_new>>({});

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [uploadingFields, setUploadingFields] = useState<Set<DocumentField>>(new Set());
    const isUploading = uploadingFields.size > 0;

    const [isEmployee, setIsEmployee] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    /* ---------------- USER ROLE ---------------- */

    useEffect(() => {
        const role = localStorage.getItem("userRole");

        setIsEmployee(role === "employee");
        setIsSuperAdmin(role === "superAdmin");
    }, []);

    /* ---------------- LOAD VEHICLE ---------------- */

    useEffect(() => {
        setShowDeleteConfirm(false);

        if (!vehicle) {
            setFormData({});
            return;
        }

        const normalizedVehicle = normalizeVehicle(vehicle as any);

        setFormData({
            ...normalizedVehicle,
            documents: pickDocuments(normalizedVehicle.documents),
        });
    }, [vehicle]);

    /* ---------------- FIELD HANDLERS ---------------- */

    const handleFieldChange = (
        field: keyof Vehicle_new,
        value:
            | string
            | number
            | React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >,
    ) => {
        const nextValue =
            typeof value === "object" ? value.target.value : value;

        setFormData((prev) => ({ ...prev, [field]: nextValue }));
    };

    const handleNumberChange = (
        name: "netWeight" | "etpNo",
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const inputValue = e.target.value;

        setFormData((prev) => ({
            ...prev,
            [name]: inputValue === "" ? undefined : inputValue,
        }));
    };

    const handleDateTimeChange = (
        field: "inTime" | "outTime",
        value: string,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: fromDateTimeLocal(value),
        }));
    };

    /*
     * CommonFileUpload uploads the file to /api/upload, which puts it
     * in S3 and returns the URL. Only that URL is kept in formData.
     */
    const handleDocumentUpload = (field: DocumentField, url: string) => {
        setFormData((prev) => ({
            ...prev,
            documents: {
                ...(prev.documents || {}),
                [field]: url?.trim() || undefined,
            },
        }));
    };

    const handleUploadingChange = (field: DocumentField, uploading: boolean) => {
        setUploadingFields((prev) => {
            const next = new Set(prev);
            if (uploading) next.add(field);
            else next.delete(field);
            return next;
        });
    };

    /* ---------------- UPDATE ---------------- */

    const handleUpdate = async () => {
        if (updateLoading || isUploading || !vehicle) return;

        const validationError = validateForm(formData);

        if (validationError) {
            toast.error(validationError);
            return;
        }

        const sno = Number(formData.sno ?? vehicle.sno);

        if (!Number.isFinite(sno)) {
            toast.error("Vehicle S.No is missing");
            return;
        }

        const currentUser = getCurrentUser();
        const isOnHold = formData.status === "ON_HOLD";

        const previous = normalizeVehicle(vehicle as any);

        const next = normalizeVehicle({
            ...previous,
            ...formData,
            // Clear a stored reason once the vehicle is no longer on hold.
            holdReason: isOnHold
                ? formData.holdReason?.trim()
                : previous.holdReason
                    ? ""
                    : undefined,
        } as any);

        const oldDocuments = previous.documents || {};
        const newDocuments = formData.documents || {};

        /* Tracking entry */

        const changes: FieldChange[] = [
            ...TRACKED_FIELDS.filter((field) =>
                isChanged(previous[field] ?? "", next[field] ?? ""),
            ).map((field) => ({
                field: String(field),
                oldValue: previous[field],
                newValue: next[field],
            })),
            ...DOCUMENT_FIELDS.filter((field) =>
                isChanged(oldDocuments[field], newDocuments[field]),
            ).map((field) => ({
                field: `documents.${field}`,
                oldValue: oldDocuments[field],
                newValue: newDocuments[field],
            })),
        ];

        const statusChanged = previous.status !== next.status;

        const trackingEntry: TrackingEntry = {
            action: getTrackingAction(
                statusChanged,
                formData.status,
                oldDocuments,
                newDocuments,
            ),
            user: currentUser,
            ...(statusChanged
                ? { fromStatus: previous.status, toStatus: next.status }
                : {}),
            ...(changes.length > 0 ? { changes } : {}),
            ...(isOnHold && next.holdReason
                ? { comment: `On hold: ${next.holdReason}` }
                : {}),
            createdAt: new Date().toISOString(),
        };

        /* Complete PUT payload */

        const updatedVehicle: Vehicle_new = {
            ...previous,
            ...next,
            vehicleNo: next.vehicleNo ?? previous.vehicleNo,
            status: next.status ?? previous.status,
            documents: pickDocuments(next.documents),
            createdAt: previous.createdAt,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser,
            tracking: [...(previous.tracking || []), trackingEntry],
        };

        // Round-trip through JSON to drop undefined values from the body.
        const payload = JSON.parse(
            JSON.stringify(updatedVehicle),
        ) as Vehicle_new;

        try {
            setUpdateLoading(true);

            const response = await fetch(`/api/vehicles/${sno}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok || !result?.success) {
                throw new Error(result?.message || "Failed to update vehicle");
            }

            // The API returns the persisted MongoDB document - use it as truth.
            const savedVehicle = result?.vehicle as Vehicle_new | undefined;

            if (!savedVehicle) {
                throw new Error(
                    "Vehicle was updated but the API did not return the updated vehicle",
                );
            }

            const chatSent = await sendGoogleChatStatusUpdate(savedVehicle);

            if (!chatSent) {
                console.warn(
                    "Vehicle updated successfully, but Google Chat notification failed",
                );
            }

            onSuccess(savedVehicle);
            toast.success("Vehicle updated successfully");
            onClose();
        } catch (error) {
            console.error("PUT vehicle update error:", error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update vehicle",
            );
        } finally {
            setUpdateLoading(false);
        }
    };

    /* ---------------- DELETE ---------------- */

    const handleDelete = async (sno: number) => {
        if (isEmployee) {
            toast.error("Employees are not allowed to delete vehicles");
            return;
        }

        if (!sno || !Number.isFinite(Number(sno))) {
            toast.error("Vehicle S.No is missing");
            return;
        }

        if (deleteLoading) return;

        try {
            setDeleteLoading(true);

            const response = await fetch(`/api/vehicles/${sno}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (
                !response.headers
                    .get("content-type")
                    ?.includes("application/json")
            ) {
                console.error(
                    "DELETE API returned non-JSON:",
                    await response.text(),
                );
                throw new Error("Delete API returned an invalid response");
            }

            const result: any = await response.json();

            if (!response.ok || !result?.success) {
                throw new Error(result?.message || "Failed to delete vehicle");
            }

            toast.success(result?.message || "Vehicle deleted successfully");

            setShowDeleteConfirm(false);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("DELETE vehicle error:", error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to delete vehicle",
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    /* ---------------- GUARDS ---------------- */

    if (!isOpen || !vehicle) {
        return null;
    }

    // Dispatched vehicles are locked to super admins.
    if (!canModifyVehicle(vehicle.status, getStoredUserRole())) {
        return null;
    }

    /* ---------------- RENDER ---------------- */

    const currentStatus = formData.status || vehicle.status;
    const isOnHold = formData.status === "ON_HOLD";

    return (
        <>
            <CommonModal
                isOpen={isOpen}
                onClose={onClose}
                size="xl"
                closeOnOutsideClick={false}
                title={
                    <span className="flex min-w-0 items-center gap-3">
                        <span className="truncate tracking-wide">
                            Edit {vehicle.vehicleNo}
                        </span>
                        {currentStatus && (
                            <StatusBadge status={currentStatus} />
                        )}
                    </span>
                }
                description="Update vehicle details, status and documents"
                footer={
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            {isSuperAdmin && (
                                <CommonButton
                                    variant="danger"
                                    icon={Trash2}
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={updateLoading}
                                >
                                    Delete
                                </CommonButton>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <CommonButton
                                variant="secondary"
                                onClick={onClose}
                                disabled={updateLoading}
                            >
                                Cancel
                            </CommonButton>

                            <CommonButton
                                icon={Save}
                                onClick={handleUpdate}
                                disabled={isUploading}
                                loading={updateLoading}
                                loadingText="Saving..."
                            >
                                {isUploading ? "Uploading..." : "Save changes"}
                            </CommonButton>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4 bg-gray-50 p-4 sm:p-6">
                    {isEmployee && (
                        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                            <p className="text-sm text-amber-800">
                                <span className="font-medium">Restricted access.</span>{" "}
                                Vehicle number, buyer, transporter, destination, ETP details and the ETP, invoice, e-way bill and loading-video documents can only be changed by an admin.
                            </p>
                        </div>
                    )}

                    {/* ---------------- VEHICLE & DRIVER ---------------- */}

                    <ModalSection title="Vehicle & driver" icon={Truck}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <CommonInput
                                label="Vehicle Number"
                                placeholder="Enter vehicle number"
                                value={formData.vehicleNo || ""}
                                onChange={(e) => handleFieldChange("vehicleNo", e)}
                                disabled={isEmployee}
                            />

                            <CommonInput
                                label="Token Number"
                                placeholder="Enter token number"
                                value={formData.tokenNo || ""}
                                onChange={(e) => handleFieldChange("tokenNo", e)}
                            />

                            <CommonInput
                                label="Driver Name"
                                placeholder="Enter driver name"
                                value={formData.driverName || ""}
                                onChange={(e) => handleFieldChange("driverName", e)}
                            />

                            <CommonInput
                                label="Driver Contact"
                                placeholder="Enter driver contact"
                                value={formData.driverContact || ""}
                                onChange={(e) => handleFieldChange("driverContact", e)}
                            />

                            <SelectField
                                label="Transporter"
                                name="transporterName"
                                value={formData.transporterName || ""}
                                onChange={(e) => handleFieldChange("transporterName", e)}
                                options={TRANSPORTERS}
                                disabled={isEmployee}
                            />

                            <SelectField
                                label="Tyre"
                                name="tyre"
                                value={formData.tyre || ""}
                                onChange={(e) => handleFieldChange("tyre", e)}
                                options={TYRE_OPTIONS}
                            />
                        </div>
                    </ModalSection>

                    {/* ---------------- MATERIAL & DISPATCH ---------------- */}

                    <ModalSection title="Material & dispatch" icon={Package}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <SelectField
                                label="Buyer"
                                name="buyerDetails"
                                value={formData.buyerDetails || ""}
                                onChange={(e) => handleFieldChange("buyerDetails", e)}
                                options={BUYERS}
                                disabled={isEmployee}
                            />

                            <CommonInput
                                label="Destination"
                                placeholder="Enter destination"
                                value={formData.destination || ""}
                                onChange={(e) => handleFieldChange("destination", e)}
                                disabled={isEmployee}
                            />

                            <CommonInput
                                label="Material Name"
                                placeholder="Enter material name"
                                value={formData.materialName || ""}
                                onChange={(e) => handleFieldChange("materialName", e)}
                            />

                            <CommonInput
                                label="Material Grade"
                                placeholder="Enter material grade"
                                value={formData.materialGrade || ""}
                                onChange={(e) => handleFieldChange("materialGrade", e)}
                            />

                            <CommonInput
                                label="Net Weight"
                                type="number"
                                placeholder="Enter net weight"
                                value={
                                    formData.netWeight !== undefined
                                        ? String(formData.netWeight)
                                        : ""
                                }
                                onChange={(e) => handleNumberChange("netWeight", e)}
                            />

                            <CommonInput
                                label="Route"
                                placeholder="Enter route"
                                value={formData.route || ""}
                                onChange={(e) => handleFieldChange("route", e)}
                            />
                        </div>
                    </ModalSection>

                    {/* ---------------- STATUS & TIMING ---------------- */}

                    <ModalSection title="Status & timing" icon={Clock}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <SelectField
                                label="Status"
                                name="status"
                                value={formData.status || ""}
                                onChange={(e) => handleFieldChange("status", e)}
                                options={STATUSES}
                            />

                            {isOnHold && (
                                <FormField
                                    label="Reason"
                                    htmlFor="edit-holdReason"
                                    required
                                    hint="Why is this vehicle on hold?"
                                    className="sm:col-span-full"
                                >
                                    <textarea
                                        id="edit-holdReason"
                                        name="holdReason"
                                        rows={3}
                                        placeholder="Enter reason for putting the vehicle on hold"
                                        value={formData.holdReason || ""}
                                        onChange={(e) => handleFieldChange("holdReason", e)}
                                        className={`${FIELD_CLASS.replace("h-10", "")} resize-y py-2`}
                                    />
                                </FormField>
                            )}

                            <CommonInput
                                label="ETP Number"
                                type="number"
                                placeholder="Enter ETP number"
                                value={
                                    formData.etpNo !== undefined
                                        ? String(formData.etpNo)
                                        : ""
                                }
                                onChange={(e) => handleNumberChange("etpNo", e)}
                                disabled={isEmployee}
                            />

                            <CommonInput
                                label="ETP Date"
                                type="date"
                                value={formData.etpDate || ""}
                                onChange={(e) => handleFieldChange("etpDate", e)}
                                disabled={isEmployee}
                            />

                            <CommonInput
                                label="In Time"
                                type="datetime-local"
                                value={toDateTimeLocal(formData.inTime)}
                                onChange={(e) =>
                                    handleDateTimeChange("inTime", e.target.value)
                                }
                            />

                            <CommonInput
                                label="Out Time"
                                type="datetime-local"
                                value={toDateTimeLocal(formData.outTime)}
                                onChange={(e) =>
                                    handleDateTimeChange("outTime", e.target.value)
                                }
                            />
                        </div>
                    </ModalSection>

                    {/* ---------------- DOCUMENTS ---------------- */}

                    <ModalSection title="Documents" icon={FileText}>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {DOCUMENT_UPLOADS.map(({ field, label, adminOnly }) => (
                                <CommonFileUpload
                                    key={field}
                                    label={label}
                                    value={formData.documents?.[field] || null}
                                    onUpload={(url: string) =>
                                        handleDocumentUpload(field, url)
                                    }
                                    onUploadingChange={(uploading) =>
                                        handleUploadingChange(field, uploading)
                                    }
                                    disabled={adminOnly && isEmployee}
                                    maxSizeMB={100}
                                />
                            ))}
                        </div>
                    </ModalSection>
                </div>
            </CommonModal>

            {/* ---------------- DELETE CONFIRMATION ---------------- */}

            <CommonModal
                isOpen={showDeleteConfirm && isSuperAdmin}
                onClose={() => setShowDeleteConfirm(false)}
                size="sm"
                showCloseButton={false}
                closeOnOutsideClick={!deleteLoading}
                footer={
                    <div className="flex justify-end gap-2">
                        <CommonButton
                            variant="secondary"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={deleteLoading}
                        >
                            Cancel
                        </CommonButton>

                        <CommonButton
                            variant="destructive"
                            icon={Trash2}
                            onClick={() => handleDelete(Number(formData.sno))}
                            loading={deleteLoading}
                            loadingText="Deleting..."
                        >
                            Delete vehicle
                        </CommonButton>
                    </div>
                }
            >
                <div className="flex gap-4 p-5 sm:p-6">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <TriangleAlert className="h-5 w-5" aria-hidden="true" />
                    </span>

                    <div>
                        <h3 className="text-base font-semibold text-gray-900">
                            Delete {vehicle.vehicleNo}?
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            This permanently removes the vehicle, its documents and activity history. This action cannot be undone.
                        </p>
                    </div>
                </div>
            </CommonModal>
        </>
    );
}

/* =============================================================
   SELECT FIELD
============================================================= */

function SelectField({
    label,
    name,
    value,
    options,
    onChange,
    disabled = false,
}: {
    label: string;
    name: string;
    value: string;
    options: string[];
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    disabled?: boolean;
}) {
    return (
        <FormField label={label} htmlFor={`edit-${name}`}>
            <select
                id={`edit-${name}`}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`${FIELD_CLASS} cursor-pointer`}
            >
                <option value="">Select {label.toLowerCase()}</option>

                {options.map((option) => (
                    <option key={option} value={option}>
                        {name === "status"
                            ? formatStatus(option)
                            : option.replaceAll("_", " ")}
                    </option>
                ))}
            </select>
        </FormField>
    );
}
