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

export default function EditVehicleModal({
    vehicle,
    onClose,
    onSuccess,
    isOpen,
}: EditVehicleModalProps) {
    const [formData, setFormData] =
        useState<Partial<Vehicle_new>>({});

    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(false);

    const [deleteLoading, setDeleteLoading] =
        useState(false);

    const [updateLoading, setUpdateLoading] =
        useState(false);

    const [isEmployee, setIsEmployee] =
        useState(false);
    const [isSuperAdmin, setIsSuperAdmin] =
        useState(false);
    /* =========================================================
       USER ROLE
    ========================================================= */

    useEffect(() => {
        const role =
            localStorage.getItem("userRole");

        setIsEmployee(
            role === "employee",
        );

        setIsSuperAdmin(
            role === "superAdmin",
        );


    }, []);

    /* =========================================================
       LOAD VEHICLE
    ========================================================= */

    useEffect(() => {
        if (!vehicle) {
            setFormData({});
            setShowDeleteConfirm(false);
            return;
        }

        const normalizedVehicle = normalizeVehicle(vehicle as any);

        setFormData({
            ...normalizedVehicle,
            documents: {
                weightSlip:
                    normalizedVehicle.documents?.weightSlip,
                LRSlip:
                    normalizedVehicle.documents?.LRSlip,
                etp:
                    normalizedVehicle.documents?.etp,
                invoiceImage:
                    normalizedVehicle.documents?.invoiceImage,
                EWayBill:
                    normalizedVehicle.documents?.EWayBill,
                vehicleImage:
                    normalizedVehicle.documents?.vehicleImage,
                driverLicenseImage:
                    normalizedVehicle.documents?.driverLicenseImage,
                vehicleRegistrationImage:
                    normalizedVehicle.documents?.vehicleRegistrationImage,
                loadingVideo:
                    normalizedVehicle.documents?.loadingVideo,
            },
        });

        setShowDeleteConfirm(false);
    }, [vehicle]);

    /* =========================================================
       BASIC INPUT CHANGE
       ---------------------------------------------------------
       Explicit field handling prevents issues when a reusable
       input component does not provide/forward a field name.
    ========================================================= */

    const handleFieldChange = (
        field: keyof Vehicle_new,
        value:
            | string
            | number
            | React.ChangeEvent<HTMLInputElement>
            | React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const nextValue =
            typeof value === "object"
                ? value.target.value
                : value;

        setFormData((prev) => ({
            ...prev,
            [field]: nextValue,
        }));

        console.log("✏️ Input Updated:", {
            field,
            value: nextValue,
        });
    };

    /* =========================================================
       NUMBER INPUT
    ========================================================= */

    const handleNumberChange = (
        name: "netWeight" | "etpNo",
        value:
            | string
            | number
            | React.ChangeEvent<HTMLInputElement>,
    ) => {
        const inputValue =
            typeof value === "object"
                ? value.target.value
                : String(value ?? "");

        setFormData((prev) => ({
            ...prev,
            [name]:
                inputValue === ""
                    ? undefined
                    : inputValue,
        }));
    };

    /* =========================================================
       DOCUMENT UPLOAD
    ========================================================= */
    const handleDocumentChange = (
        field: keyof NonNullable<Vehicle_new["documents"]>,
        file: File | null,
    ) => {
        if (!file) {
            return;
        }

        console.log("📹 Loading video selected:", {
            field,
            name: file.name,
            type: file.type,
            size: file.size,
            sizeMB: (
                file.size /
                1024 /
                1024
            ).toFixed(2),
        });
    };



    /* =========================================================
       DOCUMENT S3 UPLOAD URL
       ---------------------------------------------------------
       CommonFileUpload uploads the file to /api/upload.
       The API uploads it to AWS S3 and returns the S3 URL.
       Only that URL is stored in formData.documents.
    ========================================================= */

    const handleDocumentUpload = (
        field: keyof NonNullable<Vehicle_new["documents"]>,
        url: string,
    ) => {
        setFormData((prev) => ({
            ...prev,

            documents: {
                ...(prev.documents || {}),

                [field]:
                    url?.trim() || undefined,
            },
        }));

        console.log(
            "☁️ Document URL updated:",
            {
                field,
                url,
            },
        );
    };

    /* =========================================================
       DATE TIME
    ========================================================= */

    const toDateTimeLocal = (
        value?: string,
    ) => {
        if (!value) return "";

        /*
         * Already datetime-local
         */
        if (
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(
                value,
            )
        ) {
            return value;
        }

        /*
         * DD-MM-YYYY HH:MM AM/PM
         */
        const match =
            value.match(
                /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})\s+(AM|PM)$/i,
            );

        if (!match) return "";

        const [
            ,
            day,
            month,
            year,
            hour,
            minute,
            ampm,
        ] = match;

        let hour24 =
            Number(hour);

        if (
            ampm.toUpperCase() ===
            "PM" &&
            hour24 !== 12
        ) {
            hour24 += 12;
        }

        if (
            ampm.toUpperCase() ===
            "AM" &&
            hour24 === 12
        ) {
            hour24 = 0;
        }

        return `${year}-${month}-${day}T${String(
            hour24,
        ).padStart(
            2,
            "0",
        )}:${minute}`;
    };

    const formatDateTime = (
        value: string,
    ) => {
        if (!value) return "";

        const [
            date,
            time,
        ] = value.split("T");

        if (!date || !time) {
            return value;
        }

        const [
            year,
            month,
            day,
        ] = date.split("-");

        const [
            hour,
            minute,
        ] = time.split(":");

        let hourNumber =
            Number(hour);

        const ampm =
            hourNumber >= 12
                ? "PM"
                : "AM";

        if (hourNumber === 0) {
            hourNumber = 12;
        } else if (
            hourNumber > 12
        ) {
            hourNumber -= 12;
        }

        return `${day}-${month}-${year} ${String(
            hourNumber,
        ).padStart(
            2,
            "0",
        )}:${minute} ${ampm}`;
    };

    const handleDateTimeChange = (
        field:
            | "inTime"
            | "outTime",
        value: string,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]:
                formatDateTime(value),
        }));
    };

    /* =========================================================
       GOOGLE CHAT STATUS UPDATE
       ---------------------------------------------------------
       Called only after the vehicle PUT API succeeds.
       The Google Chat webhook URL stays server-side.
    ========================================================= */

    const sendGoogleChatStatusUpdate = async (
        updatedVehicle: Vehicle_new,
    ) => {
        try {
            const response = await fetch(
                "/api/google-chat/vehicle",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        vehicleNumber: updatedVehicle.vehicleNo,
                        status: updatedVehicle.status,
                        transporter: updatedVehicle.transporterName,
                        driverName: updatedVehicle.driverName,
                        driverMobile: updatedVehicle.driverContact,
                        location: updatedVehicle.destination,
                    }),
                },
            );

            // Do not blindly call response.json() on errors.
            // A Next.js HTML error page can otherwise cause:
            // Unexpected token '<', "<!DOCTYPE..." is not valid JSON
            if (!response.ok) {
                const errorText = await response.text();

                console.error(
                    "❌ Google Chat notification failed:",
                    errorText,
                );

                return false;
            }

            const contentType =
                response.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
                const result = await response.json();

                console.log(
                    "✅ Google Chat status notification sent:",
                    result,
                );
            } else {
                const text = await response.text();

                console.log(
                    "✅ Google Chat notification response:",
                    text,
                );
            }

            return true;
        } catch (error) {
            console.error(
                "❌ Google Chat notification error:",
                error,
            );

            // Google Chat failure must not make the vehicle update fail.
            return false;
        }
    };

    /* =========================================================
       UPDATE
       ---------------------------------------------------------
       Creates a COMPLETE Vehicle_new payload locally.
       No API integration.
    ========================================================= */

    const handleUpdate = async () => {
        if (updateLoading) return;

        if (formData.status === "ENTRY_DONE") {
            if (!formData.tokenNo?.trim()) {
                toast.error(
                    "Token Number is mandatory when status is Entry Done",
                );
                return;
            }

            if (!formData.inTime?.trim()) {
                toast.error(
                    "In Time is mandatory when status is Entry Done",
                );
                return;
            }
        }

        if (formData.status === "DISPATCH_DONE") {
            if (!formData.outTime?.trim()) {
                toast.error(
                    "Out Time is mandatory when status is Dispatch Done",
                );
                return;
            }
        }

        if (!vehicle) return;

        const sno = Number(formData.sno ?? vehicle.sno);

        if (!Number.isFinite(sno)) {
            toast.error("Vehicle S.No is missing");
            return;
        }

        const userRole =
            typeof window !== "undefined"
                ? localStorage.getItem("userRole") || undefined
                : undefined;

        const userId =
            typeof window !== "undefined"
                ? localStorage.getItem("userId") || undefined
                : undefined;

        const userName =
            typeof window !== "undefined"
                ? localStorage.getItem("userName") ||
                localStorage.getItem("name") ||
                "Unknown User"
                : "Unknown User";

        const userEmail =
            typeof window !== "undefined"
                ? localStorage.getItem("userEmail") || undefined
                : undefined;

        const currentUser = {
            ...(userId ? { id: userId } : {}),
            name: userName,
            ...(userEmail ? { email: userEmail } : {}),
            ...(userRole ? { role: userRole } : {}),
        };

        const normalizedVehicleForUpdate = normalizeVehicle(vehicle as any);

        const normalizedFormData = normalizeVehicle({
            ...normalizedVehicleForUpdate,
            ...formData,
            netWeight: formData.netWeight,
            etpNo: formData.etpNo,
            inTime: formData.inTime,
            outTime: formData.outTime,
            documents: formData.documents,
        } as any);

        const oldDocuments = normalizedVehicleForUpdate.documents || {};
        const newDocuments = formData.documents || {};

        const changes: {
            field: string;
            oldValue?: unknown;
            newValue?: unknown;
        }[] = [];

        const trackField = (
            field: keyof Vehicle_new,
            oldValue: unknown,
            newValue: unknown,
        ) => {
            if (
                JSON.stringify(oldValue) !==
                JSON.stringify(newValue)
            ) {
                changes.push({
                    field: String(field),
                    oldValue,
                    newValue,
                });
            }
        };

        const fieldsToTrack: (keyof Vehicle_new)[] = [
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
            "inTime",
            "outTime",
            "destination",
            "tokenNo",
            "driverContact",
            "etpNo",
            "etpDate",
        ];

        fieldsToTrack.forEach((field) => {
            trackField(
                field,
                normalizedVehicleForUpdate[field],
                normalizedFormData[field],
            );
        });

        /*
         * Vehicle_new.documents
         *
         * Keep these names exactly the same as the Vehicle_new interface.
         */
        const documentFields: Array<
            keyof NonNullable<
                Vehicle_new["documents"]
            >
        > = [
                "weightSlip",
                "LRSlip",
                "etp",
                "invoiceImage",
                "EWayBill",
                "vehicleImage",
                "driverLicenseImage",
                "vehicleRegistrationImage",
                "loadingVideo",
            ];

        documentFields.forEach((field) => {
            const oldValue = oldDocuments[field];
            const newValue = newDocuments[field];

            if (
                JSON.stringify(oldValue) !==
                JSON.stringify(newValue)
            ) {
                changes.push({
                    field: `documents.${field}`,
                    oldValue,
                    newValue,
                });
            }
        });

        const statusChanged =
            normalizedVehicleForUpdate.status !== normalizedFormData.status;

        let trackingAction:
            | "DETAILS_UPDATED"
            | "STATUS_CHANGED"
            | "DOCUMENT_UPLOADED"
            | "DOCUMENT_UPDATED"
            | "DOCUMENT_REMOVED"
            | "LOADING_STARTED"
            | "LOADING_COMPLETED"
            | "ETP_GENERATED"
            | "INVOICE_GENERATED"
            | "DISPATCHED" =
            "DETAILS_UPDATED";

        if (statusChanged) {
            switch (formData.status) {
                case "LOADING_STARTED":
                    trackingAction = "LOADING_STARTED";
                    break;

                case "LOADING_DONE":
                    trackingAction = "LOADING_COMPLETED";
                    break;

                case "ETP_DONE":
                    trackingAction = "ETP_GENERATED";
                    break;

                case "ETP_INVOICE_DONE":
                    trackingAction = "INVOICE_GENERATED";
                    break;

                case "DISPATCH_DONE":
                    trackingAction = "DISPATCHED";
                    break;

                default:
                    trackingAction = "STATUS_CHANGED";
            }
        } else {
            const changedDocument = documentFields.some(
                (field) =>
                    JSON.stringify(oldDocuments[field]) !==
                    JSON.stringify(newDocuments[field]),
            );

            if (changedDocument) {
                const hasRemovedDocument =
                    documentFields.some(
                        (field) =>
                            oldDocuments[field] &&
                            !newDocuments[field],
                    );

                const hasNewDocument =
                    documentFields.some(
                        (field) =>
                            !oldDocuments[field] &&
                            newDocuments[field],
                    );

                trackingAction = hasRemovedDocument
                    ? "DOCUMENT_REMOVED"
                    : hasNewDocument
                        ? "DOCUMENT_UPLOADED"
                        : "DOCUMENT_UPDATED";
            }
        }

        const trackingEntry: NonNullable<
            Vehicle_new["tracking"]
        >[number] = {
            action: trackingAction,
            user: currentUser,
            ...(vehicle.status !== formData.status
                ? {
                    fromStatus: normalizedVehicleForUpdate.status,
                    toStatus: normalizedFormData.status,
                }
                : {}),
            ...(changes.length > 0
                ? { changes }
                : {}),
            createdAt: new Date().toISOString(),
        };

        /*
         * Complete Vehicle_new.documents object.
         *
         * CommonFileUpload uploads the selected file to AWS S3 first.
         * The returned S3 URL is stored in formData.documents and sent
         * directly to the vehicle API.
         */
        /*
         * CommonFileUpload has already uploaded every selected file to S3.
         * formData.documents contains URL strings only.
         */
        const apiDocuments = normalizedFormData.documents;

        const updatedAt = new Date().toISOString();

        const updatedVehicle: Vehicle_new = {
            ...normalizedVehicleForUpdate,
            ...normalizedFormData,

            vehicleNo:
                normalizedFormData.vehicleNo ??
                normalizedVehicleForUpdate.vehicleNo,

            status:
                normalizedFormData.status ??
                normalizedVehicleForUpdate.status,

            /*
             * COMPLETE Vehicle_new.documents OBJECT
             */
            documents: {
                weightSlip:
                    apiDocuments?.weightSlip,
                LRSlip:
                    apiDocuments?.LRSlip,
                etp:
                    apiDocuments?.etp,
                invoiceImage:
                    apiDocuments?.invoiceImage,
                EWayBill:
                    apiDocuments?.EWayBill,
                vehicleImage:
                    apiDocuments?.vehicleImage,
                driverLicenseImage:
                    apiDocuments?.driverLicenseImage,
                vehicleRegistrationImage:
                    apiDocuments?.vehicleRegistrationImage,
                loadingVideo:
                    apiDocuments?.loadingVideo,
            },

            createdAt: normalizedVehicleForUpdate.createdAt,
            updatedAt,

            updatedBy: currentUser,

            tracking: [
                ...(normalizedVehicleForUpdate.tracking || []),
                trackingEntry,
            ],
        };

        /*
         * IMPORTANT:
         * Do not send undefined values where possible.
         * This keeps the PUT body clean while preserving the complete
         * existing vehicle object.
         */
        const payload = JSON.parse(
            JSON.stringify(updatedVehicle),
        ) as Vehicle_new;

        console.group("🚛 VEHICLE PUT UPDATE");
        console.log("🔢 S.No:", sno);
        console.log("🌐 API:", `/api/vehicles/${sno}`);
        console.log("📌 Previous Vehicle:", vehicle);
        console.log("📋 Changes:", changes);
        console.log("📄 COMPLETE DOCUMENT OBJECT:", payload.documents);
        console.log("📍 Tracking Entry:", trackingEntry);
        console.log("📦 COMPLETE PUT PAYLOAD:", payload);
        console.log(
            "📦 JSON PAYLOAD:",
            JSON.stringify(payload, null, 2),
        );
        console.groupEnd();

        try {
            setUpdateLoading(true);

            const response = await fetch(
                `/api/vehicles/${sno}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                },
            );

            const result = await response.json();

            console.log("📥 PUT API RESPONSE:", {
                status: response.status,
                ok: response.ok,
                result,
            });

            if (!response.ok || !result?.success) {
                throw new Error(
                    result?.message ||
                    "Failed to update vehicle",
                );
            }

            /*
             * The API returns the actual MongoDB document.
             * Use that object as the source of truth so the parent
             * receives the exact persisted vehicle.
             */
            const savedVehicle =
                result?.vehicle as Vehicle_new | undefined;

            if (!savedVehicle) {
                throw new Error(
                    "Vehicle was updated but the API did not return the updated vehicle",
                );
            }

            console.log(
                "✅ VEHICLE UPDATED SUCCESSFULLY:",
                savedVehicle,
            );

            console.log(
                "📦 SAVED MONGODB VEHICLE:",
                JSON.stringify(
                    savedVehicle,
                    null,
                    2,
                ),
            );

            /* =====================================================
               GOOGLE CHAT STATUS UPDATE
               -----------------------------------------------------
               Send the status from the actual persisted MongoDB
               vehicle, not only from the form state.
            ===================================================== */

            const chatSent =
                await sendGoogleChatStatusUpdate(savedVehicle);

            if (chatSent) {
                console.log(
                    "✅ Vehicle status sent to Google Chat",
                );
            } else {
                console.warn(
                    "⚠️ Vehicle updated successfully, but Google Chat notification failed",
                );
            }

            // Notify parent with the updated vehicle
            onSuccess(savedVehicle);

            toast.success(
                "Vehicle updated successfully",
            );

            // Close the modal first, then refresh the page
            // only after the update API has completed successfully.
            onClose();

            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error(
                "❌ PUT vehicle update error:",
                error,
            );

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update vehicle",
            );
        } finally {
            setUpdateLoading(false);
        }
    };

    /* =========================================================
    DELETE
    ---------------------------------------------------------
    Deletes vehicle using DELETE API.
 ========================================================= */

    const handleDelete = async (sno: number) => {
        if (isEmployee) {
            toast.error(
                "Employees are not allowed to delete vehicles",
            );
            return;
        }

        if (!sno || !Number.isFinite(Number(sno))) {
            toast.error("Vehicle S.No is missing");
            return;
        }

        if (deleteLoading) return;

        console.group("🗑️ VEHICLE DELETE");

        console.log("🔢 Vehicle S.No:", sno);
        console.log("🌐 API:", `/api/vehicles/${sno}`);
        console.log("📦 Vehicle Object:", vehicle);

        try {
            setDeleteLoading(true);

            const response = await fetch(
                `/api/vehicles/${sno}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            /*
             * Safely handle API response
             */
            const contentType =
                response.headers.get("content-type");

            let result: any = null;

            if (
                contentType?.includes(
                    "application/json",
                )
            ) {
                result = await response.json();
            } else {
                const text = await response.text();

                console.error(
                    "❌ DELETE API returned non-JSON:",
                    text,
                );

                throw new Error(
                    "Delete API returned an invalid response",
                );
            }

            console.log("📥 DELETE API RESPONSE:", {
                status: response.status,
                ok: response.ok,
                result,
            });

            if (
                !response.ok ||
                !result?.success
            ) {
                throw new Error(
                    result?.message ||
                    "Failed to delete vehicle",
                );
            }

            console.log(
                "✅ VEHICLE DELETED SUCCESSFULLY:",
                result,
            );

            console.groupEnd();

            toast.success(
                result?.message ||
                "Vehicle deleted successfully",
            );

            setShowDeleteConfirm(false);

            /*
             * Tell parent to refresh/update vehicle list
             */
            onSuccess();

            /*
             * Close edit modal
             */
            onClose();
        } catch (error) {
            console.error(
                "❌ DELETE VEHICLE ERROR:",
                error,
            );

            console.groupEnd();

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to delete vehicle",
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    /* =========================================================
       OPTIONS
    ========================================================= */

    const statuses = [
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

    const buyers = [
        "WELSPUN",
        "SHREE CEMENT",
        "VISHAL",
        "JSW",
        "NAVKAR MINERALS",
        "XYLE INDUSTRIES",
        "EVONITH",
    ];

    const transporters = [
        "CLEAN AND GREEN",
        "VINAYAK ENTERPRISES",
        "SHRI GHANSHYAM LOGISTIC",
        "SHREE SARASWATI",
        "KRISHNA ROAD LINES",
        "VEER LOGISTICS",
        "VINAYAK ROADWAYS",
        "LAXMI TRANSPORT CORPORATION"
    ];

    const tyreOptions = [
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

    /* ===================================================== IMPORTANT isOpen NOW CONTROLS THE MODAL ===================================================== */
    if (!isOpen || !vehicle) { return null; }

    /* =========================================================
       RENDER
    ========================================================= */

    const canDelete =
        isSuperAdmin &&
        formData.status === "WAITING_FOR_DETAILS";

    const currentStatus = formData.status || vehicle.status;

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
                                    onClick={() =>
                                        setShowDeleteConfirm(true)
                                    }
                                    disabled={!canDelete || updateLoading}
                                >
                                    Delete
                                </CommonButton>
                            )}

                            {isSuperAdmin && !canDelete && (
                                <p className="text-xs text-gray-500">
                                    Only vehicles waiting for details can be deleted.
                                </p>
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
                                loading={updateLoading}
                                loadingText="Saving..."
                            >
                                Save changes
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

                    <ModalSection title="Vehicle & driver" icon={Truck}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <CommonInput
                                label="Vehicle Number"
                                placeholder="Enter vehicle number"
                                value={
                                    formData.vehicleNo ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        "vehicleNo",
                                        e,
                                    )
                                }
                                disabled={
                                    isEmployee
                                }
                            />

                            <CommonInput
                                label="Token Number"
                                placeholder="Enter token number"
                                value={
                                    formData.tokenNo ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        "tokenNo",
                                        e,
                                    )
                                }
                            />

                            <CommonInput
                                label="Driver Name"
                                placeholder="Enter driver name"
                                value={
                                    formData.driverName ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        "driverName",
                                        e,
                                    )
                                }
                            />

                            <CommonInput
                                label="Driver Contact"
                                placeholder="Enter driver contact"
                                value={
                                    formData.driverContact ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        "driverContact",
                                        e,
                                    )
                                }
                            />

                            <SelectField
                                label="Transporter"
                                value={
                                    formData.transporterName ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        "transporterName",
                                        e,
                                    )
                                }
                                name="transporterName"
                                options={
                                    transporters
                                }
                                disabled={
                                    isEmployee
                                }
                            />

                            <SelectField
                                label="Tyre"
                                value={
                                    formData.tyre ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        "tyre",
                                        e,
                                    )
                                }
                                name="tyre"
                                options={
                                    tyreOptions
                                }
                            />
                        </div>
                    </ModalSection>

                    <ModalSection title="Material & dispatch" icon={Package}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <SelectField
                                label="Buyer"
                                value={
                                    formData.buyerDetails ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        "buyerDetails",
                                        e,
                                    )
                                }
                                name="buyerDetails"
                                options={
                                    buyers
                                }
                                disabled={
                                    isEmployee
                                }
                            />

                            <CommonInput
                                label="Destination"
                                placeholder="Enter destination"
                                value={
                                    formData.destination ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        "destination",
                                        e,
                                    )
                                }
                                disabled={
                                    isEmployee
                                }
                            />

                            <CommonInput
                                label="Material Name"
                                placeholder="Enter material name"
                                value={
                                    formData.materialName ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        "materialName",
                                        e,
                                    )
                                }
                            />

                            <CommonInput
                                label="Material Grade"
                                placeholder="Enter material grade"
                                value={
                                    formData.materialGrade ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        "materialGrade",
                                        e,
                                    )
                                }
                            />

                            <CommonInput
                                label="Net Weight"
                                type="number"
                                placeholder="Enter net weight"
                                value={
                                    formData.netWeight !==
                                        undefined
                                        ? String(
                                            formData.netWeight,
                                        )
                                        : ""
                                }
                                onChange={(e) =>
                                    handleNumberChange(
                                        "netWeight",
                                        e,
                                    )
                                }
                            />

                            <CommonInput
                                label="Route"
                                placeholder="Enter route"
                                value={
                                    formData.route ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        "route",
                                        e,
                                    )
                                }
                            />
                        </div>
                    </ModalSection>

                    <ModalSection title="Status & timing" icon={Clock}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <SelectField
                                label="Status"
                                value={
                                    formData.status ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        "status",
                                        e,
                                    )
                                }
                                name="status"
                                options={
                                    statuses
                                }
                            />

                            <CommonInput
                                label="ETP Number"
                                type="number"
                                placeholder="Enter ETP number"
                                value={
                                    formData.etpNo !==
                                        undefined
                                        ? String(
                                            formData.etpNo,
                                        )
                                        : ""
                                }
                                onChange={(e) =>
                                    handleNumberChange(
                                        "etpNo",
                                        e,
                                    )
                                }
                                disabled={
                                    isEmployee
                                }
                            />

                            <CommonInput
                                label="ETP Date"
                                type="date"
                                value={
                                    formData.etpDate ||
                                    ""
                                }
                                onChange={(e) =>
                                    handleFieldChange(
                                        "etpDate",
                                        e,
                                    )
                                }
                                disabled={
                                    isEmployee
                                }
                            />

                            <CommonInput
                                label="In Time"
                                type="datetime-local"
                                value={toDateTimeLocal(
                                    formData.inTime,
                                )}
                                onChange={(e) =>
                                    handleDateTimeChange(
                                        "inTime",
                                        e.target.value,
                                    )
                                }
                            />

                            <CommonInput
                                label="Out Time"
                                type="datetime-local"
                                value={toDateTimeLocal(
                                    formData.outTime,
                                )}
                                onChange={(e) =>
                                    handleDateTimeChange(
                                        "outTime",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                    </ModalSection>

                    <ModalSection title="Documents" icon={FileText}>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <CommonFileUpload
                                label="Vehicle Image"
                                value={
                                    formData.documents
                                        ?.vehicleImage ||
                                    null
                                }
                                onChange={(
                                    file: File | null,
                                ) =>
                                    handleDocumentChange(
                                        "vehicleImage",
                                        file,
                                    )
                                }
                                onUpload={(url: string) =>
                                    handleDocumentUpload("vehicleImage", url)
                                }
                                maxSizeMB={
                                    100
                                }
                            />

                            <CommonFileUpload
                                label="Vehicle Registration"
                                value={
                                    formData.documents
                                        ?.vehicleRegistrationImage ||
                                    null
                                }
                                onChange={(
                                    file: File | null,
                                ) =>
                                    handleDocumentChange(
                                        "vehicleRegistrationImage",
                                        file,
                                    )
                                }
                                onUpload={(url: string) =>
                                    handleDocumentUpload("vehicleRegistrationImage", url)
                                }
                                maxSizeMB={
                                    100
                                }
                            />

                            <CommonFileUpload
                                label="Driver License"
                                value={
                                    formData.documents
                                        ?.driverLicenseImage ||
                                    null
                                }
                                onChange={(
                                    file: File | null,
                                ) =>
                                    handleDocumentChange(
                                        "driverLicenseImage",
                                        file,
                                    )
                                }
                                onUpload={(url: string) =>
                                    handleDocumentUpload("driverLicenseImage", url)
                                }
                                maxSizeMB={
                                    100
                                }
                            />

                            <CommonFileUpload
                                label="Weight Slip"
                                value={
                                    formData.documents
                                        ?.weightSlip ||
                                    null
                                }
                                onChange={(
                                    file: File | null,
                                ) =>
                                    handleDocumentChange(
                                        "weightSlip",
                                        file,
                                    )
                                }
                                onUpload={(url: string) =>
                                    handleDocumentUpload("weightSlip", url)
                                }
                                maxSizeMB={
                                    100
                                }
                            />

                            <CommonFileUpload
                                label="LR Slip"
                                value={
                                    formData.documents
                                        ?.LRSlip ||
                                    null
                                }
                                onChange={(
                                    file: File | null,
                                ) =>
                                    handleDocumentChange(
                                        "LRSlip",
                                        file,
                                    )
                                }
                                onUpload={(url: string) =>
                                    handleDocumentUpload("LRSlip", url)
                                }
                                maxSizeMB={
                                    100
                                }
                            />

                            <CommonFileUpload
                                label="ETP"
                                value={
                                    formData.documents
                                        ?.etp ||
                                    null
                                }
                                onChange={(
                                    file: File | null,
                                ) =>
                                    handleDocumentChange(
                                        "etp",
                                        file,
                                    )
                                }
                                onUpload={(url: string) =>
                                    handleDocumentUpload("etp", url)
                                }
                                disabled={
                                    isEmployee
                                }
                                maxSizeMB={
                                    100
                                }
                            />

                            <CommonFileUpload
                                label="Invoice"
                                value={
                                    formData.documents
                                        ?.invoiceImage ||
                                    null
                                }
                                onChange={(
                                    file: File | null,
                                ) =>
                                    handleDocumentChange(
                                        "invoiceImage",
                                        file,
                                    )
                                }
                                onUpload={(url: string) =>
                                    handleDocumentUpload("invoiceImage", url)
                                }
                                disabled={
                                    isEmployee
                                }
                                maxSizeMB={
                                    100
                                }
                            />

                            <CommonFileUpload
                                label="E-Way Bill"
                                value={
                                    formData.documents
                                        ?.EWayBill ||
                                    null
                                }
                                onChange={(
                                    file: File | null,
                                ) =>
                                    handleDocumentChange(
                                        "EWayBill",
                                        file,
                                    )
                                }
                                onUpload={(url: string) =>
                                    handleDocumentUpload("EWayBill", url)
                                }
                                disabled={
                                    isEmployee
                                }
                                maxSizeMB={
                                    100
                                }
                            />

                            <CommonFileUpload
                                label="Loading Video"
                                value={
                                    formData.documents
                                        ?.loadingVideo ||
                                    null
                                }
                                onChange={(
                                    file: File | null,
                                ) =>
                                    handleDocumentChange(
                                        "loadingVideo",
                                        file,
                                    )
                                }
                                onUpload={(url: string) =>
                                    handleDocumentUpload(
                                        "loadingVideo",
                                        url,
                                    )
                                }
                                disabled={
                                    isEmployee
                                }
                                maxSizeMB={100}
                            />
                        </div>
                    </ModalSection>
                </div>
            </CommonModal>

            {/* ================= DELETE CONFIRMATION ================= */}

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
    onChange: (
        e: React.ChangeEvent<HTMLSelectElement>,
    ) => void;
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
