"use client";

import React, { ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import CommonButton from "./CommonButton";

export interface CommonModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: ReactNode;
    /** Secondary line under the title. */
    description?: ReactNode;
    /** Extra header content next to the close button (badges, actions). */
    headerActions?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    showCloseButton?: boolean;
    closeOnOutsideClick?: boolean;
    className?: string;
}

const SIZE_CLASS = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-5xl",
    full: "sm:max-w-[96vw]",
} as const;

/*
 * Stack of open modals so Escape / scroll-lock only affect the
 * top-most one (e.g. a file preview opened from Vehicle Details).
 */
const openModals: symbol[] = [];

const CommonModal: React.FC<CommonModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    headerActions,
    children,
    footer,
    size = "lg",
    showCloseButton = true,
    closeOnOutsideClick = true,
    className = "",
}) => {
    const titleId = useId();
    const descriptionId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) return;

        const token = Symbol("modal");
        openModals.push(token);

        const isTop = () => openModals[openModals.length - 1] === token;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isTop()) {
                event.stopPropagation();
                onCloseRef.current();
            }
        };

        document.addEventListener("keydown", handleEscape);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const previouslyFocused = document.activeElement as HTMLElement | null;
        dialogRef.current?.focus();

        return () => {
            document.removeEventListener("keydown", handleEscape);
            openModals.splice(openModals.indexOf(token), 1);

            if (openModals.length === 0) {
                document.body.style.overflow = previousOverflow;
            }

            previouslyFocused?.focus?.();
        };
    }, [isOpen]);

    if (!isOpen || typeof document === "undefined") return null;

    const hasHeader = title || description || headerActions || showCloseButton;

    return createPortal(
        <div
            className="
                fixed
                inset-0
                z-[9999]
                flex
                items-end
                justify-center
                bg-gray-900/50
                backdrop-blur-[2px]
                sm:items-center
                sm:p-6
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
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={description ? descriptionId : undefined}
                tabIndex={-1}
                className={`
                    flex
                    max-h-[92vh]
                    w-full
                    flex-col
                    overflow-hidden
                    rounded-t-2xl
                    bg-white
                    shadow-2xl
                    ring-1
                    ring-black/5
                    outline-none
                    sm:max-h-[90vh]
                    sm:rounded-2xl
                    ${SIZE_CLASS[size]}
                    ${className}
                `}
            >
                {/* ================= HEADER ================= */}

                {hasHeader && (
                    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
                        <div className="min-w-0 flex-1">
                            {title && (
                                <h2
                                    id={titleId}
                                    className="truncate text-lg font-semibold text-gray-900"
                                >
                                    {title}
                                </h2>
                            )}

                            {description && (
                                <div
                                    id={descriptionId}
                                    className="mt-0.5 text-sm text-gray-500"
                                >
                                    {description}
                                </div>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            {headerActions}

                            {showCloseButton && (
                                <CommonButton
                                    variant="ghost"
                                    icon={X}
                                    onClick={onClose}
                                    aria-label="Close"
                                    title="Close"
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* ================= CONTENT ================= */}

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {children}
                </div>

                {/* ================= FOOTER ================= */}

                {footer && (
                    <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-5 py-3 sm:px-6">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
};

export default CommonModal;
