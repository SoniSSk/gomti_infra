"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LoaderCircle, LogOut } from "lucide-react";

export interface CommonUserMenuProps {
    name: string;
    role?: string;
    onLogout: () => void;
    loggingOut?: boolean;
}

/** "KULDEEP SONI" -> "Kuldeep Soni" */
const toTitleCase = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

/** "SuperAdmin" / "super_admin" -> "Super Admin" */
const formatRole = (role: string) =>
    toTitleCase(
        role
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/[_-]+/g, " "),
    );

const getInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");

const CommonUserMenu = ({
    name,
    role,
    onLogout,
    loggingOut = false,
}: CommonUserMenuProps) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuId = useId();

    const displayName = toTitleCase(name);
    const displayRole = role ? formatRole(role) : "";

    /* Close on outside click / Escape. */
    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    return (
        <div ref={containerRef} className="relative">
            {/* ================= TRIGGER ================= */}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={menuId}
                aria-label={`Account menu for ${displayName}`}
                className="flex h-10 cursor-pointer items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
                <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700"
                    aria-hidden="true"
                >
                    {getInitials(displayName)}
                </span>

                <span className="hidden min-w-0 flex-col items-start leading-tight md:flex">
                    <span className="max-w-[160px] truncate text-sm font-medium text-gray-900">
                        {displayName}
                    </span>

                    {displayRole && (
                        <span className="max-w-[160px] truncate text-xs text-gray-500">
                            {displayRole}
                        </span>
                    )}
                </span>

                <ChevronDown
                    className={`hidden h-4 w-4 text-gray-400 transition-transform duration-200 md:block ${open ? "rotate-180" : ""}`}
                    aria-hidden="true"
                />
            </button>

            {/* ================= MENU ================= */}
            {open && (
                <div
                    id={menuId}
                    role="menu"
                    aria-label="Account"
                    className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5"
                >
                    <div className="flex items-center gap-3 px-4 py-3">
                        <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700"
                            aria-hidden="true"
                        >
                            {getInitials(displayName)}
                        </span>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                                {displayName}
                            </p>

                            {displayRole && (
                                <p className="truncate text-xs text-gray-500">
                                    {displayRole}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 p-1">
                        <button
                            type="button"
                            role="menuitem"
                            onClick={onLogout}
                            disabled={loggingOut}
                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:bg-red-50 focus-visible:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loggingOut ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <LogOut className="h-4 w-4" aria-hidden="true" />
                            )}
                            {loggingOut ? "Logging out..." : "Log out"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommonUserMenu;
