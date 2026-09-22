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
   INPUT CLASS
========================================================= */

const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

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

    return (
        <form
            onSubmit={handleSubmit}
            className="mb-6 rounded-2xl"
        >
            {/* =================================================
               NOTICE
            ================================================= */}

            <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                <p className="text-sm font-medium text-orange-800">
                    ⚠️ Driver se boliye ki{" "}
                    <span className="font-bold">
                        transporter se WhatsApp
                        group par vehicle
                        number update
                        karwayein.
                    </span>
                </p>

                <p className="mt-1 text-sm font-bold text-red-700">
                    Bina transporter details ke
                    kisi bhi vehicle ko load nahi
                    kiya jayega.
                </p>
            </div>

            {/* =================================================
               REQUIRED NOTICE
            ================================================= */}

            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-600">
                    <span className="font-bold text-red-600">
                        *
                    </span>{" "}
                    All fields are mandatory.
                </p>
            </div>

            {/* =================================================
               FORM
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* =============================================
                   VEHICLE NUMBER
                ============================================= */}

                <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Vehicle Number{" "}
                        <span className="text-red-500">
                            *
                        </span>
                    </label>

                    <input
                        name="vehicleNo"
                        value={
                            formData.vehicleNo
                        }
                        onChange={
                            handleChange
                        }
                        className={
                            inputClass
                        }
                        placeholder="Enter vehicle number"
                        required
                        disabled={
                            submitting
                        }
                        autoComplete="off"
                        style={{
                            textTransform:
                                "uppercase",
                        }}
                    />
                </div>

                {/* =============================================
                   CONFIRM VEHICLE NUMBER
                ============================================= */}

                <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Confirm Vehicle Number{" "}
                        <span className="text-red-500">
                            *
                        </span>
                    </label>

                    <input
                        name="vehicleNoConfirm"
                        value={
                            formData.vehicleNoConfirm
                        }
                        onChange={
                            handleChange
                        }
                        className={`${inputClass} ${vehicleNumbersMismatch
                                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                                : vehicleNumbersMatch
                                    ? "border-green-500 focus:border-green-500 focus:ring-green-200"
                                    : ""
                            }`}
                        placeholder="Re-enter vehicle number"
                        required
                        disabled={
                            submitting
                        }
                        autoComplete="off"
                        style={{
                            textTransform:
                                "uppercase",
                        }}
                    />

                    {vehicleNumbersMatch && (
                        <p className="mt-1 text-xs font-medium text-green-600">
                            ✓ Vehicle numbers
                            match
                        </p>
                    )}

                    {vehicleNumbersMismatch && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                            ✕ Vehicle numbers do
                            not match
                        </p>
                    )}
                </div>

                {/* =============================================
                   TRANSPORTER
                ============================================= */}

                <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Transporter Name{" "}
                        <span className="text-red-500">
                            *
                        </span>
                    </label>

                    <select
                        name="transporterName"
                        value={
                            formData.transporterName
                        }
                        onChange={
                            handleChange
                        }
                        className={
                            inputClass
                        }
                        required
                        disabled={
                            submitting
                        }
                    >
                        <option value="">
                            Select Transporter
                        </option>

                        {TRANSPORTERS.map(
                            (
                                transporter,
                            ) => (
                                <option
                                    key={
                                        transporter
                                    }
                                    value={
                                        transporter
                                    }
                                >
                                    {
                                        transporter
                                    }
                                </option>
                            ),
                        )}
                    </select>
                </div>

                {/* =============================================
                   BUYER
                ============================================= */}

                <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Buyer{" "}
                        <span className="text-red-500">
                            *
                        </span>
                    </label>

                    <select
                        name="buyerDetails"
                        value={
                            formData.buyerDetails
                        }
                        onChange={
                            handleChange
                        }
                        className={
                            inputClass
                        }
                        required
                        disabled={
                            submitting
                        }
                    >
                        <option value="">
                            Select Buyer
                        </option>

                        {BUYERS.map(
                            (buyer) => (
                                <option
                                    key={
                                        buyer
                                    }
                                    value={
                                        buyer
                                    }
                                >
                                    {buyer}
                                </option>
                            ),
                        )}
                    </select>
                </div>

                {/* =============================================
                   MATERIAL
                ============================================= */}

                <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Material{" "}
                        <span className="text-red-500">
                            *
                        </span>
                    </label>

                    <select
                        name="materialName"
                        value={
                            formData.materialName
                        }
                        onChange={
                            handleChange
                        }
                        className={
                            inputClass
                        }
                        required
                        disabled={
                            submitting
                        }
                    >
                        <option value="">
                            Select Material
                        </option>

                        {MATERIALS.map(
                            (
                                material,
                            ) => (
                                <option
                                    key={
                                        material
                                    }
                                    value={
                                        material
                                    }
                                >
                                    {
                                        material
                                    }
                                </option>
                            ),
                        )}
                    </select>
                </div>

                {/* =============================================
                   MATERIAL GRADE
                ============================================= */}

                <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Material Grade{" "}
                        <span className="text-red-500">
                            *
                        </span>
                    </label>

                    <input
                        type="text"
                        name="materialGrade"
                        value={
                            formData.materialGrade
                        }
                        onChange={
                            handleChange
                        }
                        className={
                            inputClass
                        }
                        placeholder="e.g. 53-60"
                        required
                        disabled={
                            submitting
                        }
                        autoComplete="off"
                    />
                </div>

                {/* =============================================
                   DESTINATION
                ============================================= */}

                <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Destination{" "}
                        <span className="text-red-500">
                            *
                        </span>
                    </label>

                    <input
                        type="text"
                        name="destination"
                        value={
                            formData.destination
                        }
                        onChange={
                            handleChange
                        }
                        className={
                            inputClass
                        }
                        placeholder="Enter destination"
                        required
                        disabled={
                            submitting
                        }
                        autoComplete="off"
                    />
                </div>
            </div>

            {/* =================================================
               INITIAL STATUS
            ================================================= */}

            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase text-gray-500">
                    Initial Status
                </div>

                <div className="mt-1 text-sm font-semibold text-gray-800">
                    Waiting For Details
                </div>
            </div>

            {/* =================================================
               VALIDATION STATUS
            ================================================= */}

            {!isFormValid && (
                <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
                    <p className="text-sm font-medium text-yellow-800">
                        Please fill all
                        mandatory fields
                        before adding the
                        vehicle.
                    </p>
                </div>
            )}

            {/* =================================================
               BUTTON
            ================================================= */}

            <div className="mt-8 flex justify-end">
                <button
                    type="submit"
                    disabled={
                        submitting ||
                        !isFormValid
                    }
                    className="
                        w-full
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
                        sm:w-auto
                    "
                >
                    {submitting
                        ? "Saving Vehicle..."
                        : "Add Vehicle"}
                </button>
            </div>
        </form>
    );
}