"use client";

import React, {
    useCallback,
    useState,
    useSyncExternalStore,
} from "react";
import { LogOut, Plus } from "lucide-react";

import { signOut } from "next-auth/react";

import CommonButton from "./CommonButton";
import CommonModal from "./CommonModal";
import CommonUserMenu from "./CommonUserMenu";
import AddVehicle from "../vehicle/AddVehicle";
import Logo from "../../common/Logo";
import { canAddVehicle } from "@/app/utils/vehiclePermissions";

export interface CommonHeaderProps {
    title: string;
    subtitle?: string;
    userName?: string;
    userRole?: string;
    /** Overrides the default logout (clear localStorage + next-auth signOut). */
    onLogout?: () => void;
    /** Called after a vehicle is added, e.g. to refresh the table. */
    onVehicleAdded?: () => void;
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
    onLogout,
    onVehicleAdded,
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

    const showAddVehicle = canAddVehicle(userRole);

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
                            gap-2.5
                        "
                    >
                        {/* Logo */}

                        <Logo height={36} priority />

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
                        {/* Add Vehicle (admins and super admins only) */}

                        {showAddVehicle && (
                            <>
                                <CommonButton
                                    icon={Plus}
                                    onClick={() =>
                                        setIsAddVehicleOpen(true)
                                    }
                                >
                                    <span className="hidden sm:inline">
                                        Add Vehicle
                                    </span>
                                    <span className="sm:hidden">
                                        Add
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
                            >
                                <span className="hidden sm:inline">
                                    Log out
                                </span>
                            </CommonButton>
                        )}
                    </div>
                </div>
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
<div className="bg-gray-50 p-4 sm:p-6">
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