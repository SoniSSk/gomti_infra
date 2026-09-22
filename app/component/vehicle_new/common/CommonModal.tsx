"use client";

import React, { ReactNode, useEffect } from "react";

interface CommonModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    showCloseButton?: boolean;
    closeOnOutsideClick?: boolean;
    className?: string;
}

const CommonModal: React.FC<CommonModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = "lg",
    showCloseButton = true,
    closeOnOutsideClick = true,
    className = "",
}) => {
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-6xl",
        full: "max-w-[96vw]",
    };

    return (
        <div
            className="
                fixed
                inset-0
                z-[9999]
                flex
                items-center
                justify-center
                bg-black/70
                p-3
                sm:p-5
            "
            onMouseDown={(event) => {
                if (
                    closeOnOutsideClick &&
                    event.target === event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <div
                className={`
                    flex
                    max-h-[95vh]
                    w-full
                    ${sizeClasses[size]}
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    bg-white
                    shadow-2xl
                    ${className}
                `}
                onMouseDown={(event) => event.stopPropagation()}
            >
                {/* ================= HEADER ================= */}

                {(title || showCloseButton) && (
                    <div
                        className="
                            flex
                            min-h-[60px]
                            shrink-0
                            items-center
                            justify-between
                            gap-3
                            border-b
                            border-gray-200
                            bg-white
                            px-4
                            py-3
                            sm:px-5
                        "
                    >
                        <div className="min-w-0 flex-1">
                            {title && (
                                <h2
                                    className="
                                        truncate
                                        text-base
                                        font-semibold
                                        text-gray-800
                                        sm:text-lg
                                    "
                                    title={title}
                                >
                                    {title}
                                </h2>
                            )}
                        </div>

                        {showCloseButton && (
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close modal"
                                className="
                                    inline-flex
                                    h-9
                                    w-9
                                    shrink-0
                                    cursor-pointer
                                    items-center
                                    justify-center
                                    rounded-lg
                                    text-gray-500
                                    transition
                                    hover:bg-gray-100
                                    hover:text-gray-700
                                "
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* ================= CONTENT ================= */}

                <div
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                        overscroll-contain
                    "
                >
                    {children}
                </div>

                {/* ================= FIXED BOTTOM FOOTER ================= */}

                {footer && (
                    <div
                        className="
                            shrink-0
                            border-t
                            border-gray-200
                            bg-white
                            px-4
                            py-3
                            shadow-[0_-4px_12px_rgba(0,0,0,0.06)]
                            sm:px-5
                            sm:py-4
                        "
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommonModal;