"use client";

import React, {
    ReactNode,
    useCallback,
    useState,
    useSyncExternalStore,
} from "react";
import { LogOut, Plus } from "lucide-react";

import { signOut } from "next-auth/react";

import CommonButton from "./CommonButton";
import CommonModal from "./CommonModal";
import CommonUserMenu from "./CommonUserMenu";
import CommonModuleNav from "./CommonModuleNav";
import AddVehicle from "../vehicle/AddVehicle";
import Logo from "../../common/Logo";
import { canAddVehicle } from "@/app/utils/vehiclePermissions";

export interface CommonHeaderProps {
    title: string;
    subtitle?: string;
    userName?: string;
    userRole?: string;
    /** Granted dashboards; the module nav shows only these. */
    dashboards?: string[];
    /** Overrides the default logout (clear localStorage + next-auth signOut). */
    onLogout?: () => void;
    /** Called after a vehicle is added, e.g. to refresh the table. */
    onVehicleAdded?: () => void;
    /** Page-specific buttons shown before the account menu (e.g. Add Lab Report). */
    actions?: ReactNode;
    loading?: boolean;
}

const emptySubscribe = () => () => { };

const getServerSnapshot = () => "";

const getUserName = () => {
    try {
        return localStorage.getItem("userName") || "";
    } catch {
        return "";
    }
};

const CommonHeader: React.FC<CommonHeaderProps> = ({
    title,
    subtitle,
    userName,
    userRole,
    dashboards,
    onLogout,
    onVehicleAdded,
    actions,
    loading = false,
}) => {
    const storedUserName = useSyncExternalStore(
        emptySubscribe,
        getUserName,
        getServerSnapshot,
    );

    const displayUserName =
        userName || storedUserName;

    const hasUser = Boolean(displayUserName);

    // Only pages that handle onVehicleAdded (vehicle dispatch) get the button
    const showAddVehicle =
        Boolean(onVehicleAdded) && canAddVehicle(userRole);

    const [isAddVehicleOpen, setIsAddVehicleOpen] =
        useState(false);

    const [loggingOut, setLoggingOut] = useState(false);

    const isLoggingOut = loading || loggingOut;

    const handleLogout = useCallback(async () => {
        if (isLoggingOut) {
            return;
        }

        if (onLogout) {
            onLogout();
            return;
        }

        setLoggingOut(true);

        try {
            localStorage.clear();
        } catch {
            // Storage may be unavailable; the session is what matters.
        }

        /*
         * The session cookie must be cleared too, otherwise proxy.ts
         * still treats the user as logged in.
         */
        await signOut({ redirectTo: "/" });
    }, [isLoggingOut, onLogout]);

    const handleAddVehicleSuccess = () => {
        setIsAddVehicleOpen(false);
        onVehicleAdded?.();
    };

    return (
        <>
<header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <div
className="
                        mx-auto
                        flex
                        min-h-16
                        w-full
                        max-w-screen-2xl
                        items-center
                        justify-between
                        gap-3
                        px-4
                        sm:px-6
                        lg:px-8
                    "
                >
                    {/* ================= LEFT ================= */}

                    <div
                        className="
                            flex
                            min-w-0
                            items-center
                            gap-2
                            sm:gap-2.5
                        "
                    >
                        {/* Logo */}

                        <Logo height={36} priority className="max-h-8 sm:max-h-none" />

                        {/* Title */}

                        <div className="min-w-0">
                            <h1
                                className="
                                    truncate
                                    text-base
                                    font-bold
                                    leading-tight
                                    text-gray-900
                                    sm:text-lg
                                "
                            >
                                {title}
                            </h1>

                            {subtitle && (
                                <p
                                    className="
                                        mt-0.5
                                        truncate
                                        text-[11px]
                                        font-medium
                                        text-gray-500
                                        sm:text-xs
                                    "
                                >
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ================= RIGHT ================= */}

                    <div
                        className="
                            flex
                            shrink-0
                            items-center
                            gap-2
                            sm:gap-3
                        "
                    >
                        {/* Page actions */}

                        {actions && (
                            <>
                                {actions}

                                <span
                                    className="mx-1 hidden h-6 w-px bg-gray-200 sm:block"
                                    aria-hidden="true"
                                />
                            </>
                        )}

                        {/* Add Vehicle (employees, admins and super admins) */}

                        {showAddVehicle && (
                            <>
                                <CommonButton
                                    icon={Plus}
                                    onClick={() =>
                                        setIsAddVehicleOpen(true)
                                    }
                                    aria-label="Add vehicle"
                                    title="Add vehicle"
                                    className="max-sm:w-10 max-sm:px-0"
                                >
                                    <span className="hidden sm:inline">
                                        Add Vehicle
                                    </span>
                                </CommonButton>

                                <span
                                    className="mx-1 hidden h-6 w-px bg-gray-200 sm:block"
                                    aria-hidden="true"
                                />
                            </>
                        )}

                        {/* Account menu (falls back to a plain Logout button) */}

                        {hasUser ? (
                            <CommonUserMenu
                                name={displayUserName}
                                role={userRole}
                                onLogout={handleLogout}
                                loggingOut={isLoggingOut}
                            />
                        ) : (
                            <CommonButton
                                variant="secondary"
                                icon={LogOut}
                                onClick={handleLogout}
                                loading={isLoggingOut}
                                aria-label="Log out"
                                className="max-sm:w-10 max-sm:px-0"
                            >
                                <span className="hidden sm:inline">
                                    Log out
                                </span>
                            </CommonButton>
                        )}
                    </div>
                </div>

                {/* ================= MODULE NAV ================= */}

                <CommonModuleNav userRole={userRole} dashboards={dashboards} />
            </header>

            {/* ================= ADD VEHICLE MODAL ================= */}

            <CommonModal
                isOpen={showAddVehicle && isAddVehicleOpen}
                onClose={() =>
                    setIsAddVehicleOpen(false)
                }
title="Add vehicle"
                description="Register a new vehicle for dispatch. All fields are required."
                size="xl"
                closeOnOutsideClick={false}
            >
<div className="bg-gray-50 px-3 pt-3 sm:p-6">
                    <AddVehicle
                        userRole={userRole}
                        onSuccess={
                            handleAddVehicleSuccess
                        }
                    />
                </div>
            </CommonModal>
        </>
    );
};

export default CommonHeader;