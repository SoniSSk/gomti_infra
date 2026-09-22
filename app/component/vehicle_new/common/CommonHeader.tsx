"use client";

import React, {
    useCallback,
    useState,
    useSyncExternalStore,
} from "react";

import CommonModal from "../common/CommonModal";
import AddVehicle from "../vehicle /AddVehicle";

export interface CommonHeaderProps {
    title: string;
    subtitle?: string;
    userName?: string;
    onLogout: () => void;
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
    onLogout,
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

    const [isAddVehicleOpen, setIsAddVehicleOpen] =
        useState(false);

    const handleLogout = useCallback(() => {
        if (!loading) {
            onLogout();
        }
    }, [loading, onLogout]);

    const handleAddVehicleSuccess = () => {
        setIsAddVehicleOpen(false);
    };

    return (
        <>
            <header className="sticky top-0 z-40 w-full bg-white">
                <div
                    className="
                        flex
                        min-h-16
                        w-full
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

                        <div
                            className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                bg-orange-50
                                text-orange-600
                                ring-1
                                ring-orange-100
                            "
                        >
                            <span className="text-sm font-extrabold">
                                G
                            </span>
                        </div>

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
                        "
                    >
                        {/* Add Vehicle */}

                        <button
                            type="button"
                            onClick={() =>
                                setIsAddVehicleOpen(true)
                            }
                            className="
                                inline-flex
                                h-9
                                cursor-pointer
                                items-center
                                gap-1.5
                                rounded-lg
                                bg-orange-600
                                px-3
                                text-xs
                                font-semibold
                                text-white
                                shadow-sm
                                transition
                                duration-200
                                hover:bg-orange-700
                                active:scale-95
                                focus:outline-none
                                focus:ring-2
                                focus:ring-orange-200
                                sm:px-4
                            "
                        >
                            {/* Plus Icon */}

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-4 w-4"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 5v14M5 12h14"
                                />
                            </svg>

                            <span>
                                Add Vehicle
                            </span>
                        </button>

                        {/* User */}

                        {hasUser && (
                            <>
                                <div
                                    className="
                                        hidden
                                        items-center
                                        gap-2
                                        sm:flex
                                    "
                                >
                                    <div
                                        className="
                                            flex
                                            h-8
                                            items-center
                                            justify-center
                                            rounded-full
                                            border
                                            border-orange-200
                                            bg-orange-50
                                            px-3
                                            text-[11px]
                                            font-bold
                                            uppercase
                                            tracking-wide
                                            text-orange-600
                                            shadow-sm
                                        "
                                    >
                                        Admin
                                    </div>

                                    <div className="text-right">
                                        <p
                                            className="
                                                max-w-[130px]
                                                truncate
                                                text-xs
                                                font-semibold
                                                text-gray-800
                                            "
                                        >
                                            {displayUserName}
                                        </p>

                                        <div
                                            className="
                                                mt-0.5
                                                flex
                                                items-center
                                                justify-end
                                                gap-1.5
                                            "
                                        >
                                            <span
                                                className="
                                                    h-1.5
                                                    w-1.5
                                                    rounded-full
                                                    bg-green-500
                                                "
                                            />

                                            <span
                                                className="
                                                    text-[10px]
                                                    font-medium
                                                    text-gray-500
                                                "
                                            >
                                                Online
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="
                                        hidden
                                        h-7
                                        w-px
                                        bg-gray-200
                                        sm:block
                                    "
                                />
                            </>
                        )}

                        {/* Logout */}

                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loading}
                            aria-label={
                                loading
                                    ? "Logging out"
                                    : "Logout"
                            }
                            className="
                                inline-flex
                                h-9
                                cursor-pointer
                                items-center
                                gap-1.5
                                rounded-lg
                                border
                                border-orange-200
                                bg-orange-50
                                px-2.5
                                text-xs
                                font-semibold
                                text-orange-600
                                transition
                                duration-200
                                hover:border-orange-300
                                hover:bg-orange-500
                                hover:text-white
                                active:scale-95
                                focus:outline-none
                                focus:ring-2
                                focus:ring-orange-200
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                                sm:px-3
                            "
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15"
                                />

                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18 15l3-3m0 0l-3-3m3 3H9"
                                />
                            </svg>

                            <span className="hidden sm:inline">
                                {loading
                                    ? "Logging out..."
                                    : "Logout"}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ================= ADD VEHICLE MODAL ================= */}

            <CommonModal
                isOpen={isAddVehicleOpen}
                onClose={() =>
                    setIsAddVehicleOpen(false)
                }
                title="Add Vehicle"
                size="xl"
                closeOnOutsideClick={!loading}
            >
                <div className="p-4 sm:p-6">
                    <AddVehicle
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