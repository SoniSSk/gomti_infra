/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, LayoutGrid, Save, UserPlus, UserRound } from "lucide-react";

import {
    MIN_PASSWORD_LENGTH,
    USER_ROLES,
    toUserRole,
    type UserObject,
    type UserRole,
} from "@/app/types/user";
import {
    ALL_DASHBOARD_KEYS,
    DASHBOARDS,
    toDashboardKeys,
} from "@/app/constant/dashboards";

import CommonButton from "../vehicle_new/common/CommonButton";
import CommonModal from "../vehicle_new/common/CommonModal";
import { FIELD_CLASS, FormField, ModalSection } from "../vehicle_new/common/ModalParts";

interface UserFormModalProps {
    /** null opens the modal in "add" mode. */
    user: UserObject | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    /** The signed-in super admin; their own role is locked. */
    currentUserId?: string;
}

interface UserFormData {
    name: string;
    email: string;
    role: UserRole | "";
    buyer: string;
    /** Granted dashboard keys; ignored for a super admin. */
    dashboards: string[];
    password: string;
    confirmPassword: string;
}

const EMPTY_FORM: UserFormData = {
    name: "",
    email: "",
    role: "employee",
    buyer: "",
    dashboards: [],
    password: "",
    confirmPassword: "",
};

const toFormData = (user: UserObject | null): UserFormData =>
    user
        ? {
            ...EMPTY_FORM,
            name: user.name ?? "",
            email: user.email ?? "",
            role: toUserRole(user.role),
            buyer: user.buyer ?? "",
            dashboards: toDashboardKeys(user.dashboards),
        }
        : EMPTY_FORM;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UserFormModal({
    user,
    isOpen,
    onClose,
    onSuccess,
    currentUserId,
}: UserFormModalProps) {
    const isEdit = Boolean(user);
    const isSelf = Boolean(user && user.id === currentUserId);

    const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(toFormData(user));
        }
    }, [isOpen, user]);

    const setField = <K extends keyof UserFormData>(key: K, value: UserFormData[K]) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    const isSuperAdmin = formData.role === "superadmin";

    const toggleDashboard = (key: string, checked: boolean) =>
        setFormData((prev) => ({
            ...prev,
            dashboards: toDashboardKeys(
                checked
                    ? [...prev.dashboards, key]
                    : prev.dashboards.filter((item) => item !== key),
            ),
        }));

    const allDashboardsChecked =
        formData.dashboards.length === ALL_DASHBOARD_KEYS.length;

    const handleSave = async () => {
        const name = formData.name.trim();
        const email = formData.email.trim().toLowerCase();
        const { password, confirmPassword, role } = formData;
        const buyer = formData.buyer.trim();

        if (!name) {
            toast.error("Name is required");
            return;
        }

        if (!EMAIL_PATTERN.test(email)) {
            toast.error("Enter a valid email");
            return;
        }

        if (!role) {
            toast.error("Role is required");
            return;
        }

        if (role === "customer" && !buyer) {
            toast.error("Buyer is required for a customer");
            return;
        }

        // Password is required to add; optional (reset) when editing
        if (!isEdit || password) {
            if (password.length < MIN_PASSWORD_LENGTH) {
                toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
                return;
            }

            if (password !== confirmPassword) {
                toast.error("Passwords don't match");
                return;
            }
        }

        const payload = {
            name,
            email,
            ...(!isSelf && { role }),
            ...(role === "customer" && { buyer }),
            dashboards: formData.dashboards,
            ...(password && { password }),
        };

        try {
            setSaving(true);

            const response = await fetch(
                isEdit ? `/api/users/${user?.id}` : "/api/users",
                {
                    method: isEdit ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                },
            );

            const result = await response.json().catch(() => null);

            if (!response.ok || !result?.success) {
                throw new Error(
                    result?.message || `Failed to ${isEdit ? "update" : "create"} user`,
                );
            }

            toast.success(result?.message || (isEdit ? "User updated" : "User created"));
            onSuccess();
        } catch (error) {
            console.error(`${isEdit ? "PUT" : "POST"} user error:`, error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : `Failed to ${isEdit ? "update" : "create"} user`,
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            closeOnOutsideClick={false}
            title={isEdit ? `Edit ${user?.name || user?.email}` : "Add user"}
            description={
                isEdit
                    ? "Update account details, role, dashboard access or password"
                    : "Create an account. The user signs in with this email and password."
            }
            footer={
                <div className="flex gap-2 sm:justify-end">
                    <CommonButton
                        variant="secondary"
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </CommonButton>

                    <CommonButton
                        icon={isEdit ? Save : UserPlus}
                        onClick={handleSave}
                        loading={saving}
                        loadingText="Saving..."
                        className="flex-1 sm:flex-none"
                    >
                        {isEdit ? "Save changes" : "Add user"}
                    </CommonButton>
                </div>
            }
        >
            <form
                className="space-y-3 bg-gray-50 p-3 sm:space-y-4 sm:p-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleSave();
                }}
            >
                <ModalSection title="Account" icon={UserRound}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Name" htmlFor="user-name" required>
                            <input
                                id="user-name"
                                value={formData.name}
                                onChange={(e) => setField("name", e.target.value)}
                                className={FIELD_CLASS}
                                placeholder="Full name"
                                disabled={saving}
                                autoComplete="off"
                            />
                        </FormField>

                        <FormField label="Email" htmlFor="user-email" required>
                            <input
                                id="user-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setField("email", e.target.value)}
                                className={FIELD_CLASS}
                                placeholder="name@company.com"
                                disabled={saving}
                                autoComplete="off"
                            />
                        </FormField>

                        <FormField
                            label="Role"
                            htmlFor="user-role"
                            required
                            hint={isSelf ? "You can't change your own role." : undefined}
                        >
                            <select
                                id="user-role"
                                value={formData.role}
                                onChange={(e) => setField("role", e.target.value as UserRole)}
                                disabled={saving || isSelf}
                                className={`${FIELD_CLASS} cursor-pointer`}
                            >
                                {!formData.role && (
                                    <option value="">
                                        {user?.role ? `${user.role} (unknown)` : "Select role"}
                                    </option>
                                )}
                                {USER_ROLES.map(({ value, label }) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        {formData.role === "customer" && (
                            <FormField
                                label="Buyer"
                                htmlFor="user-buyer"
                                required
                                hint="Only vehicles whose buyer contains this name are shown."
                            >
                                <input
                                    id="user-buyer"
                                    value={formData.buyer}
                                    onChange={(e) => setField("buyer", e.target.value)}
                                    className={`${FIELD_CLASS} uppercase`}
                                    placeholder="e.g. JSW STEEL"
                                    disabled={saving}
                                    autoComplete="off"
                                />
                            </FormField>
                        )}
                    </div>
                </ModalSection>

                <ModalSection
                    title="Dashboard access"
                    description={
                        isSuperAdmin
                            ? "Super admins can open every dashboard"
                            : "Tick the dashboards this user can open"
                    }
                    icon={LayoutGrid}
                    action={
                        !isSuperAdmin && (
                            <button
                                type="button"
                                onClick={() =>
                                    setField(
                                        "dashboards",
                                        allDashboardsChecked ? [] : ALL_DASHBOARD_KEYS,
                                    )
                                }
                                disabled={saving}
                                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-orange-600 transition hover:bg-orange-50 disabled:opacity-50"
                            >
                                {allDashboardsChecked ? "Clear all" : "Select all"}
                            </button>
                        )
                    }
                >
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {DASHBOARDS.map(({ key, label }) => {
                            const checked =
                                isSuperAdmin || formData.dashboards.includes(key);

                            return (
                                <label
                                    key={key}
                                    className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${checked
                                        ? "border-orange-200 bg-orange-50 text-gray-900"
                                        : "border-gray-200 bg-white text-gray-700"
                                        } ${isSuperAdmin || saving
                                            ? "cursor-not-allowed opacity-70"
                                            : "cursor-pointer hover:border-orange-300"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => toggleDashboard(key, e.target.checked)}
                                        disabled={isSuperAdmin || saving}
                                        className="h-4 w-4 shrink-0 cursor-pointer accent-orange-500 disabled:cursor-not-allowed"
                                    />
                                    {label}
                                </label>
                            );
                        })}
                    </div>

                    {!isSuperAdmin && !formData.dashboards.length && (
                        <p className="mt-3 text-xs text-gray-500">
                            No dashboards ticked: this user can sign in but
                            can&apos;t open any module.
                        </p>
                    )}
                </ModalSection>

                <ModalSection
                    title={isEdit ? "Reset password" : "Password"}
                    description={isEdit ? "Leave blank to keep the current password" : undefined}
                    icon={KeyRound}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                            label={isEdit ? "New password" : "Password"}
                            htmlFor="user-password"
                            required={!isEdit}
                            hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
                        >
                            <input
                                id="user-password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setField("password", e.target.value)}
                                className={FIELD_CLASS}
                                disabled={saving}
                                autoComplete="new-password"
                            />
                        </FormField>

                        <FormField
                            label="Confirm password"
                            htmlFor="user-confirm-password"
                            required={!isEdit}
                        >
                            <input
                                id="user-confirm-password"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setField("confirmPassword", e.target.value)}
                                className={FIELD_CLASS}
                                disabled={saving}
                                autoComplete="new-password"
                            />
                        </FormField>
                    </div>
                </ModalSection>

                {/* Lets Enter submit the form */}
                <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
            </form>
        </CommonModal>
    );
}
