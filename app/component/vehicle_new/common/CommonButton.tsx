"use client";

import React from "react";

export interface CommonButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    loadingText?: string;
    containerClassName?: string;
}

const CommonButton = React.forwardRef<
    HTMLButtonElement,
    CommonButtonProps
>(
    (
        {
            loading = false,
            loadingText = "Loading...",
            children,
            containerClassName = "",
            className = "",
            disabled,
            type = "button",
            ...props
        },
        ref
    ) => {
        return (
            <div className={`w-full ${containerClassName}`}>
                <button
                    ref={ref}
                    type={type}
                    disabled={disabled || loading}
                    {...props}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 active:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                >
                    {loading ? (
                        <>
                            {/* Loader */}
                            <span
                                className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                                aria-hidden="true"
                            />

                            {loadingText}
                        </>
                    ) : (
                        children
                    )}
                </button>
            </div>
        );
    }
);

CommonButton.displayName = "CommonButton";

export default CommonButton;