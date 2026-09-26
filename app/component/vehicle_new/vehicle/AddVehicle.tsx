"use client";

import React, {
    useMemo,
    useState,
} from "react";

import { useAppDispatch } from "@/app/redux/hooks";
import {
    hideLoader,
    showLoader,
} from "@/app/redux/loaderSlice";

import toast from "react-hot-toast";
import {
    CircleCheck,
    CircleX,
    Package,
    Plus,
    TriangleAlert,
    Truck,
} from "lucide-react";

import CommonButton from "../common/CommonButton";
import { FIELD_CLASS, FormField, ModalSection } from "../common/ModalParts";
import { StatusBadge } from "../common/vehicleStatus";

import { Vehicle_new } from "@/app/types/vehicle_new";

interface VehicleFormProps {
    onSuccess: () => void;
}

/* =========================================================
   TRANSPORTERS
========================================================= */

const TRANSPORTERS = [
    "CLEAN AND GREEN",
    "VINAYAK ENTERPRISES",
    "SHRI GHANSHYAM LOGISTIC",
    "SHREE SARASWATI",
    "KRISHNA ROAD LINES",
    "VEER LOGISTICS",
    "VINAYAK ROADWAYS",
    "LAXMI TRANSPORT CORPORATION"
];

/* =========================================================
   BUYERS
========================================================= */

const BUYERS = [
    "WELSPUN",
    "SHREE CEMENT",
    "VISHAL",
    "JSW",
    "NAVKAR MINERALS",
    "XYLE INDUSTRIES",
    "EVONITH",
];

/* =========================================================
   MATERIALS
========================================================= */

const MATERIALS = [
    "Iron Ore Fines",
    "Iron Ore Lumps",
];

/* =========================================================
   FORM DATA
========================================================= */

interface VehicleFormData {
    vehicleNo: string;
    vehicleNoConfirm: string;

    transporterName: string;
    buyerDetails: string;
    materialName: string;
    materialGrade: string;
    destination: string;
}

const INITIAL_FORM_DATA: VehicleFormData = {
    vehicleNo: "",
    vehicleNoConfirm: "",

    transporterName: "",
    buyerDetails: "",
    materialName: "",
    materialGrade: "",
    destination: "",
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AddVehicle({
    onSuccess,
}: VehicleFormProps) {
    const dispatch = useAppDispatch();

    const [submitting, setSubmitting] =
        useState(false);

    const [formData, setFormData] =
        useState<VehicleFormData>(
            INITIAL_FORM_DATA,
        );

    /* =======================================================
       VEHICLE NUMBER NORMALIZE
    ======================================================= */

    const normalizeVehicleNo = (
        value: string,
    ) => {
        return value
            .trim()
            .replace(/\s+/g, "")
            .toUpperCase();
    };

    /* =======================================================
       NORMALIZED VALUES
    ======================================================= */

    const normalizedVehicleNo =
        useMemo(
            () =>
                normalizeVehicleNo(
                    formData.vehicleNo,
                ),
            [formData.vehicleNo],
        );

    const normalizedVehicleNoConfirm =
        useMemo(
            () =>
                normalizeVehicleNo(
                    formData.vehicleNoConfirm,
                ),
            [
                formData.vehicleNoConfirm,
            ],
        );

    /* =======================================================
       VEHICLE NUMBER MATCH
    ======================================================= */

    const vehicleNumbersMatch =
        normalizedVehicleNo.length > 0 &&
        normalizedVehicleNoConfirm.length > 0 &&
        normalizedVehicleNo ===
        normalizedVehicleNoConfirm;

    const vehicleNumbersMismatch =
        normalizedVehicleNoConfirm.length > 0 &&
        normalizedVehicleNo !==
        normalizedVehicleNoConfirm;

    /* =======================================================
       FORM VALIDATION
    ======================================================= */

    const isFormValid =
        normalizedVehicleNo.length > 0 &&
        normalizedVehicleNoConfirm.length > 0 &&
        vehicleNumbersMatch &&
        formData.transporterName.trim().length > 0 &&
        formData.buyerDetails.trim().length > 0 &&
        formData.materialName.trim().length > 0 &&
        formData.materialGrade.trim().length > 0 &&
        formData.destination.trim().length > 0;

    /* =======================================================
       HANDLE CHANGE
    ======================================================= */

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement
        >,
    ) => {
        const {
            name,
            value,
        } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /* =======================================================
       RESET
    ======================================================= */

    const resetForm = () => {
        setFormData({
            ...INITIAL_FORM_DATA,
        });
    };

    /* =======================================================
       GOOGLE CHAT NOTIFICATION
    ======================================================= */

    const sendGoogleChatNotification =
        async () => {
            try {
                const response =
                    await fetch(
                        "/api/google-chat/vehicle",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify({
                                vehicleNumber:
                                    normalizedVehicleNo,

                                status:
                                    "WAITING_FOR_DETAILS",

                                transporter:
                                    formData.transporterName.trim(),

                                location:
                                    formData.destination.trim(),
                            }),
                        },
                    );

                if (!response.ok) {
                    const error =
                        await response.text();

                    console.error(
                        "Google Chat notification failed:",
                        error,
                    );

                    return false;
                }

                return true;
            } catch (error) {
                console.error(
                    "Google Chat notification error:",
                    error,
                );

                return false;
            }
        };

    /* =======================================================
       SUBMIT
    ======================================================= */

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>,
    ) => {
        e.preventDefault();

        /* -----------------------------------------------
           VEHICLE NUMBER
        ----------------------------------------------- */

        if (!normalizedVehicleNo) {
            toast.error(
                "Vehicle number is required",
            );
            return;
        }

        /* -----------------------------------------------
           CONFIRM VEHICLE NUMBER
        ----------------------------------------------- */

        if (!normalizedVehicleNoConfirm) {
            toast.error(
                "Please confirm vehicle number",
            );
            return;
        }

        /* -----------------------------------------------
           VEHICLE NUMBER MATCH
        ----------------------------------------------- */

        if (!vehicleNumbersMatch) {
            toast.error(
                "Vehicle numbers do not match",
            );
            return;
        }

        /* -----------------------------------------------
           TRANSPORTER
        ----------------------------------------------- */

        if (
            !formData.transporterName.trim()
        ) {
            toast.error(
                "Transporter name is required",
            );
            return;
        }

        /* -----------------------------------------------
           BUYER
        ----------------------------------------------- */

        if (
            !formData.buyerDetails.trim()
        ) {
            toast.error(
                "Buyer is required",
            );
            return;
        }

        /* -----------------------------------------------
           MATERIAL
        ----------------------------------------------- */

        if (
            !formData.materialName.trim()
        ) {
            toast.error(
                "Material is required",
            );
            return;
        }

        /* -----------------------------------------------
           MATERIAL GRADE
        ----------------------------------------------- */

        if (
            !formData.materialGrade.trim()
        ) {
            toast.error(
                "Material grade is required",
            );
            return;
        }

        /* -----------------------------------------------
           DESTINATION
        ----------------------------------------------- */

        if (
            !formData.destination.trim()
        ) {
            toast.error(
                "Destination is required",
            );
            return;
        }

        try {
            setSubmitting(true);

            dispatch(showLoader());

            /* -------------------------------------------
               CURRENT TIME
            ------------------------------------------- */

            const now =
                new Date().toISOString();

            /* -------------------------------------------
               LOCAL STORAGE USER
            ------------------------------------------- */

            const userEmail =
                typeof window !==
                    "undefined"
                    ? localStorage.getItem(
                        "userEmail",
                    )
                    : null;

            const userName =
                typeof window !==
                    "undefined"
                    ? localStorage.getItem(
                        "userName",
                    )
                    : null;

            const userRole =
                typeof window !==
                    "undefined"
                    ? localStorage.getItem(
                        "userRole",
                    )
                    : null;

            const userId =
                typeof window !==
                    "undefined"
                    ? localStorage.getItem(
                        "userId",
                    )
                    : null;

            /* -------------------------------------------
               PAYLOAD
            ------------------------------------------- */

            const payload: Vehicle_new = {
                /* =========================
                   DATABASE
                ========================= */

                _id: undefined,

                /* =========================
                   BASIC VEHICLE
                ========================= */

                vehicleNo:
                    normalizedVehicleNo,

                sno: Date.now(),

                transporterName:
                    formData.transporterName.trim(),

                /* =========================
                   BUYER / MATERIAL
                ========================= */

                buyerDetails:
                    formData.buyerDetails.trim(),

                materialName:
                    formData.materialName.trim(),

                materialGrade:
                    formData.materialGrade.trim(),

                destination:
                    formData.destination.trim(),

                /* =========================
                   STATUS
                ========================= */

                status:
                    "WAITING_FOR_DETAILS",

                /* =========================
                   CREATED BY
                ========================= */

                createdBy: {
                    id:
                        userEmail ||
                        undefined,

                    name:
                        userName ||
                        "Unknown User",

                    email:
                        userEmail ||
                        undefined,

                    role:
                        userRole ||
                        undefined,
                },

                /* =========================
                   TRACKING
                ========================= */

                tracking: [
                    {
                        action:
                            "VEHICLE_CREATED",

                        user: {
                            id:
                                userId ||
                                undefined,

                            name:
                                userName ||
                                "Unknown User",

                            email:
                                userEmail ||
                                undefined,

                            role:
                                userRole ||
                                undefined,
                        },

                        fromStatus:
                            undefined,

                        toStatus:
                            "WAITING_FOR_DETAILS",

                        changes: [
                            {
                                field:
                                    "vehicleNo",

                                oldValue:
                                    undefined,

                                newValue:
                                    normalizedVehicleNo,
                            },

                            {
                                field:
                                    "transporterName",

                                oldValue:
                                    undefined,

                                newValue:
                                    formData.transporterName.trim(),
                            },

                            {
                                field:
                                    "buyerDetails",

                                oldValue:
                                    undefined,

                                newValue:
                                    formData.buyerDetails.trim(),
                            },

                            {
                                field:
                                    "materialName",

                                oldValue:
                                    undefined,

                                newValue:
                                    formData.materialName.trim(),
                            },

                            {
                                field:
                                    "materialGrade",

                                oldValue:
                                    undefined,

                                newValue:
                                    formData.materialGrade.trim(),
                            },

                            {
                                field:
                                    "destination",

                                oldValue:
                                    undefined,

                                newValue:
                                    formData.destination.trim(),
                            },

                            {
                                field:
                                    "status",

                                oldValue:
                                    undefined,

                                newValue:
                                    "WAITING_FOR_DETAILS",
                            },
                        ],

                        comment:
                            "Vehicle created",

                        createdAt:
                            now,
                    },
                ],

                /* =========================
                   DATABASE TIMESTAMPS
                ========================= */

                createdAt:
                    now,

                updatedAt:
                    now,
            };

            /* -------------------------------------------
               VEHICLE API
            ------------------------------------------- */

            const response =
                await fetch(
                    "/api/vehicles",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify(
                                payload,
                            ),
                    },
                );

            /* -------------------------------------------
               API RESPONSE
            ------------------------------------------- */

            const data =
                await response.json();

            /* -------------------------------------------
               API ERROR
            ------------------------------------------- */

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to save vehicle",
                );
            }

            /* -------------------------------------------
               VEHICLE SAVED SUCCESSFULLY
            ------------------------------------------- */

            resetForm();

            toast.success(
                data?.message ||
                "Vehicle saved successfully",
            );

            /* -------------------------------------------
               GOOGLE CHAT
            ------------------------------------------- */

            const chatSent =
                await sendGoogleChatNotification();

            if (chatSent) {
                console.log(
                    "Google Chat notification sent successfully",
                );
            } else {
                console.warn(
                    "Vehicle saved, but Google Chat notification failed",
                );
            }

            /* -------------------------------------------
               PARENT SUCCESS
            ------------------------------------------- */

            onSuccess();

            /* -------------------------------------------
               AUTO REFRESH
            ------------------------------------------- */

            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error(
                "Vehicle save error:",
                error,
            );

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to save vehicle",
            );
        } finally {
            setSubmitting(false);

            dispatch(hideLoader());
        }
    };

    /* =======================================================
       UI
    ======================================================= */

    const remainingFields = [
        normalizedVehicleNo,
        normalizedVehicleNoConfirm,
        formData.transporterName,
        formData.buyerDetails,
        formData.materialName,
        formData.materialGrade,
        formData.destination,
    ].filter((value) => !String(value).trim()).length;

    const renderSelect = (
        name: "transporterName" | "buyerDetails" | "materialName",
        label: string,
        options: string[],
    ) => (
        <FormField label={label} htmlFor={`add-${name}`} required>
            <select
                id={`add-${name}`}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                className={`${FIELD_CLASS} cursor-pointer`}
                required
                disabled={submitting}
            >
                <option value="">Select {label.toLowerCase()}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </FormField>
    );

    const confirmStateClass = vehicleNumbersMismatch
        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
        : vehicleNumbersMatch
            ? "border-green-500 focus:border-green-500 focus:ring-green-100"
            : "border-gray-300 focus:border-orange-500 focus:ring-orange-100";

    return (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* ================= NOTICE ================= */}

            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />

                <div className="text-sm">
                    <p className="text-amber-900">
                        Driver se boliye ki{" "}
                        <span className="font-semibold">
                            transporter se WhatsApp group par vehicle number update karwayein.
                        </span>
                    </p>
                    <p className="mt-1 font-semibold text-red-700">
                        Bina transporter details ke kisi bhi vehicle ko load nahi kiya jayega.
                    </p>
                </div>
            </div>

            {/* ================= VEHICLE NUMBER ================= */}

            <ModalSection
                title="Vehicle number"
                description="Enter it twice to avoid typos"
                icon={Truck}
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Vehicle number" htmlFor="add-vehicleNo" required>
                        <input
                            id="add-vehicleNo"
                            name="vehicleNo"
                            value={formData.vehicleNo}
                            onChange={handleChange}
                            className={`${FIELD_CLASS} font-medium uppercase tracking-wide`}
                            placeholder="e.g. MH12AB1234"
                            required
                            disabled={submitting}
                            autoComplete="off"
                        />
                    </FormField>

                    <FormField
                        label="Confirm vehicle number"
                        htmlFor="add-vehicleNoConfirm"
                        required
                        error={
                            vehicleNumbersMismatch && (
                                <span className="inline-flex items-center gap-1">
                                    <CircleX className="h-3.5 w-3.5" aria-hidden="true" />
                                    Vehicle numbers don&apos;t match
                                </span>
                            )
                        }
                        hint={
                            vehicleNumbersMatch && (
                                <span className="inline-flex items-center gap-1 font-medium text-green-600">
                                    <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                    Vehicle numbers match
                                </span>
                            )
                        }
                    >
                        <input
                            id="add-vehicleNoConfirm"
                            name="vehicleNoConfirm"
                            value={formData.vehicleNoConfirm}
                            onChange={handleChange}
                            className={`h-10 w-full rounded-lg border bg-white px-3 text-sm font-medium uppercase tracking-wide text-gray-900 outline-none transition placeholder:text-gray-400 placeholder:normal-case focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 ${confirmStateClass}`}
                            placeholder="Re-enter vehicle number"
                            required
                            disabled={submitting}
                            autoComplete="off"
                            aria-invalid={vehicleNumbersMismatch || undefined}
                        />
                    </FormField>
                </div>
            </ModalSection>

            {/* ================= DISPATCH DETAILS ================= */}

            <ModalSection title="Dispatch details" icon={Package}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {renderSelect("transporterName", "Transporter", TRANSPORTERS)}
                    {renderSelect("buyerDetails", "Buyer", BUYERS)}
                    {renderSelect("materialName", "Material", MATERIALS)}

                    <FormField label="Material grade" htmlFor="add-materialGrade" required>
                        <input
                            id="add-materialGrade"
                            type="text"
                            name="materialGrade"
                            value={formData.materialGrade}
                            onChange={handleChange}
                            className={FIELD_CLASS}
                            placeholder="e.g. 53-60"
                            required
                            disabled={submitting}
                            autoComplete="off"
                        />
                    </FormField>

                    <FormField
                        label="Destination"
                        htmlFor="add-destination"
                        required
                        className="sm:col-span-2"
                    >
                        <input
                            id="add-destination"
                            type="text"
                            name="destination"
                            value={formData.destination}
                            onChange={handleChange}
                            className={FIELD_CLASS}
                            placeholder="Enter destination"
                            required
                            disabled={submitting}
                            autoComplete="off"
                        />
                    </FormField>
                </div>
            </ModalSection>

            {/* ================= SUBMIT ================= */}

            <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    Starts as <StatusBadge status="WAITING_FOR_DETAILS" />
                </p>

                <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center">
                    {!isFormValid && (
                        <p className="text-center text-xs text-gray-500 sm:text-right">
                            {vehicleNumbersMismatch
                                ? "Fix the vehicle number to continue"
                                : `${remainingFields} required field${remainingFields === 1 ? "" : "s"} left`}
                        </p>
                    )}

                    <CommonButton
                        type="submit"
                        icon={Plus}
                        disabled={!isFormValid}
                        loading={submitting}
                        loadingText="Saving vehicle..."
                    >
                        Add vehicle
                    </CommonButton>
                </div>
            </div>
        </form>
    );
}