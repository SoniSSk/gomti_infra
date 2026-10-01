"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock, FlaskConical, Plus } from "lucide-react";

import { useAppDispatch } from "@/app/redux/hooks";
import { hideLoader, showLoader } from "@/app/redux/loaderSlice";
import {
    canAccessLab,
    getStoredUserRole,
} from "@/app/utils/vehiclePermissions";

import CommonButton from "../vehicle_new/common/CommonButton";
import { FIELD_CLASS, FormField, ModalSection } from "../vehicle_new/common/ModalParts";
import { LabStatusBadge } from "./labStatus";

import type { LabObject } from "@/app/types/lab";

interface AddLabProps {
    onSuccess: () => void;
    /** Session name, shown as Assigned by; falls back to the name saved at login. */
    userName?: string;
    /** Session role; falls back to the role saved at login. */
    userRole?: string;
}

/* =========================================================
   FORM DATA
========================================================= */

interface LabFormData {
    lot: string;
    lotDescription: string;
    size: string;
    assignedTo: string;
    /** datetime-local value (local time, no zone). */
    expectedReportAt: string;
}

/* Default lab assignee; can be changed per report. */
const DEFAULT_ASSIGNED_TO = "Arun";

const INITIAL_FORM_DATA: LabFormData = {
    lot: "",
    lotDescription: "",
    size: "",
    assignedTo: DEFAULT_ASSIGNED_TO,
    expectedReportAt: "",
};

const REQUIRED_FIELDS: { key: keyof LabFormData; label: string }[] = [
    { key: "lot", label: "Lot" },
    { key: "lotDescription", label: "Lot description" },
    { key: "size", label: "Size" },
    { key: "assignedTo", label: "Assigned to" },
];

const getStoredUserName = (): string => {
    try {
        return localStorage.getItem("userName") || "";
    } catch {
        return "";
    }
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AddLab({
    onSuccess,
    userName: sessionName,
    userRole: sessionRole,
}: AddLabProps) {
    const role = sessionRole || getStoredUserRole();

    const assignedBy = sessionName || getStoredUserName();

    const showSubmit = canAccessLab(role);

    const dispatch = useAppDispatch();

    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<LabFormData>(INITIAL_FORM_DATA);

    const missingFields = REQUIRED_FIELDS.filter(
        ({ key }) => !formData[key].trim(),
    );

    const isFormValid = missingFields.length === 0;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    /* =======================================================
       SUBMIT
    ======================================================= */

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!showSubmit) {
            return;
        }

        if (!isFormValid) {
            toast.error(`${missingFields[0].label} is required`);
            return;
        }

        const payload: Partial<LabObject> = {
            lot: formData.lot.trim().toUpperCase(),
            lotDescription: formData.lotDescription.trim(),
            size: formData.size.trim(),
            assignedTo: formData.assignedTo.trim(),
            assignedBy,
            status: "WAITING_FOR_DETAILS",
            sno: Date.now(),
            ...(formData.expectedReportAt && {
                expectedReportAt: new Date(formData.expectedReportAt).toISOString(),
            }),
        };

        try {
            setSubmitting(true);
            dispatch(showLoader());

            const response = await fetch("/api/lab", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.message || "Failed to save lab report");
            }

            setFormData(INITIAL_FORM_DATA);

            toast.success(data?.message || "Lab report added");

            onSuccess();
        } catch (error) {
            console.error("Lab save error:", error);

            toast.error(
                error instanceof Error ? error.message : "Failed to save lab report",
            );
        } finally {
            setSubmitting(false);
            dispatch(hideLoader());
        }
    };

    /* =======================================================
       UI
    ======================================================= */

    const renderInput = (
        name: keyof LabFormData,
        label: string,
        placeholder: string,
        { required = true, className = "", inputClassName = "" } = {},
    ) => (
        <FormField label={label} htmlFor={`add-lab-${name}`} required={required} className={className}>
            <input
                id={`add-lab-${name}`}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                className={`${FIELD_CLASS} ${inputClassName}`}
                placeholder={placeholder}
                required={required}
                disabled={submitting}
                autoComplete="off"
            />
        </FormField>
    );

    return (
        <form onSubmit={handleSubmit} className="min-w-0 space-y-4 sm:space-y-5" noValidate>
            {/* ================= LOT ================= */}

            <ModalSection title="Lot details" icon={FlaskConical}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {renderInput("lot", "Lot", "e.g. LOT-101", {
                        inputClassName: "font-medium uppercase tracking-wide",
                    })}
                    {renderInput("size", "Size", "e.g. 0-10 mm")}

                    <FormField
                        label="Lot description"
                        htmlFor="add-lab-lotDescription"
                        required
                        className="sm:col-span-2"
                    >
                        <textarea
                            id="add-lab-lotDescription"
                            name="lotDescription"
                            value={formData.lotDescription}
                            onChange={handleChange}
                            className={`${FIELD_CLASS} h-auto min-h-20 py-2`}
                            placeholder="Material, grade, stack location..."
                            required
                            disabled={submitting}
                            rows={3}
                        />
                    </FormField>
                </div>
            </ModalSection>

            {/* ================= ASSIGNMENT ================= */}

            <ModalSection title="Assignment" icon={CalendarClock}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormField
                        label="Assigned by"
                        htmlFor="add-lab-assignedBy"
                    >
                        <input
                            id="add-lab-assignedBy"
                            value={assignedBy}
                            className={`${FIELD_CLASS} cursor-not-allowed bg-gray-50`}
                            readOnly
                            disabled
                        />
                    </FormField>

                    {renderInput("assignedTo", "Assigned to", "Who will take the sample")}

                    <FormField
                        label="Expected report by"
                        htmlFor="add-lab-expectedReportAt"
                        hint="Optional"
                    >
                        <input
                            id="add-lab-expectedReportAt"
                            type="datetime-local"
                            name="expectedReportAt"
                            value={formData.expectedReportAt}
                            onChange={handleChange}
                            className={FIELD_CLASS}
                            disabled={submitting}
                        />
                    </FormField>
                </div>
            </ModalSection>

            {/* ================= SUBMIT ================= */}

            <div className="sticky bottom-0 z-10 -mx-3 flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:z-auto sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:bg-transparent sm:px-0 sm:pt-4 sm:pb-0">
                <p className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    Starts as <LabStatusBadge status="WAITING_FOR_DETAILS" />
                </p>

                <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center">
                    {!isFormValid && (
                        <p className="text-center text-xs text-gray-500 sm:text-right">
                            {missingFields.length} required field
                            {missingFields.length === 1 ? "" : "s"} left
                        </p>
                    )}

                    {showSubmit && (
                        <CommonButton
                            type="submit"
                            icon={Plus}
                            disabled={!isFormValid}
                            loading={submitting}
                            loadingText="Saving report..."
                            className="w-full sm:w-auto"
                        >
                            Add lab report
                        </CommonButton>
                    )}
                </div>
            </div>
        </form>
    );
}
