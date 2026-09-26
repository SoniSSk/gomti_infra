"use client";

import React from "react";
import { LoaderCircle, type LucideIcon } from "lucide-react";

export type CommonButtonVariant =
    | "primary"
    | "secondary"
    | "ghost"
    | "danger"
    | "destructive"
    | "success";

export type CommonButtonSize = "sm" | "md";

export interface CommonButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: CommonButtonVariant;
    size?: CommonButtonSize;
    /** Lucide icon shown before the label (replaced by a spinner while loading). */
    icon?: LucideIcon;
    loading?: boolean;
    /** Label while loading; defaults to the normal children. */
    loadingText?: React.ReactNode;
    fullWidth?: boolean;
}

const VARIANT_CLASS: Record<CommonButtonVariant, string> = {
    primary:
        "bg-orange-600 text-white shadow-sm hover:bg-orange-700 focus-visible:ring-orange-300",
    secondary:
        "border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:ring-orange-200",
    ghost:
        "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-orange-200",
    danger:
        "border border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-red-200",
    destructive:
        "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-300",
    success:
        "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 focus-visible:ring-green-200",
};

const SIZE_CLASS: Record<CommonButtonSize, { base: string; icon: string; iconOnly: string }> = {
    sm: { base: "h-8 gap-1.5 px-2.5 text-xs", icon: "h-3.5 w-3.5", iconOnly: "h-8 w-8" },
    md: { base: "h-10 gap-2 px-4 text-sm", icon: "h-4 w-4", iconOnly: "h-10 w-10" },
};

const CommonButton = React.forwardRef<
    HTMLButtonElement,
    CommonButtonProps
>(
    (
        {
            variant = "primary",
            size = "md",
            icon: Icon,
            loading = false,
            loadingText,
            fullWidth = false,
            children,
            className = "",
            disabled,
            type = "button",
            ...props
        },
        ref
    ) => {
        const sizeClass = SIZE_CLASS[size];
        const iconOnly = !children && Boolean(Icon);

        return (
            <button
                ref={ref}
                type={type}
                disabled={disabled || loading}
                aria-busy={loading || undefined}
                {...props}
                className={`inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg font-semibold transition duration-150 focus:outline-none focus-visible:ring-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS[variant]} ${iconOnly ? `${sizeClass.iconOnly} p-0` : sizeClass.base} ${fullWidth ? "w-full" : ""} ${className}`}
            >
                {loading ? (
                    <LoaderCircle
                        className={`${sizeClass.icon} animate-spin`}
                        aria-hidden="true"
                    />
                ) : (
                    Icon && (
                        <Icon
                            className={sizeClass.icon}
                            aria-hidden="true"
                        />
                    )
                )}

                {loading && loadingText !== undefined
                    ? loadingText
                    : children}
            </button>
        );
    }
);

CommonButton.displayName = "CommonButton";

export default CommonButton;
