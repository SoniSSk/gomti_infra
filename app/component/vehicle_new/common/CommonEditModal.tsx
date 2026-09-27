"use client";

import React, { useEffect } from "react";

interface CommonEditModalProps {
    isOpen?: boolean;
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: React.ReactNode;

    footer?: React.ReactNode;

    maxWidth?: string;
    className?: string;

    closeOnOverlayClick?: boolean;
    closeDisabled?: boolean;
}

export default function CommonEditModal({
    isOpen = true,
    title,
    subtitle,
    onClose,
    children,
    footer,
    maxWidth = "max-w-7xl",
    className = "",
    closeOnOverlayClick = false,
    closeDisabled = false,
}: CommonEditModalProps) {
    /* Lock background scroll while open (restores the previous value). */
    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleOverlayClick = () => {
        if (closeOnOverlayClick && !closeDisabled) {
            onClose();
        }
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
        bg-slate-950/70
        p-0
        backdrop-blur-sm
        sm:p-5
      "
            onClick={handleOverlayClick}
        >
            <div
                className={`
          relative
          flex
          h-[100dvh]
          w-full
          ${maxWidth}
          flex-col
          overflow-hidden
          rounded-none
          border-0
          sm:h-[96dvh]
          sm:rounded-2xl
          sm:border
          border-orange-200
          bg-slate-100
          shadow-[0_30px_100px_rgba(0,0,0,0.35)]
          ${className}
        `}
                onClick={(event) => event.stopPropagation()}
            >
                {/* HEADER */}
                <header
                    className="
            relative
            shrink-0
            overflow-hidden
            bg-gradient-to-br
            from-orange-700
            via-orange-600
            to-amber-500
            px-4
            pt-[max(1rem,env(safe-area-inset-top))]
            pb-4
            text-white
            sm:px-7
            sm:pt-4
          "
                >
                    {/* Background decoration */}
                    <div
                        className="
              pointer-events-none
              absolute
              -right-20
              -top-24
              h-64
              w-64
              rounded-full
              bg-yellow-300/25
              blur-3xl
            "
                    />

                    <div
                        className="
              pointer-events-none
              absolute
              -bottom-24
              left-1/3
              h-48
              w-48
              rounded-full
              bg-orange-900/20
              blur-3xl
            "
                    />

                    <div className="relative flex items-center justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span
                                    className="
                    rounded-md
                    bg-white
                    px-2.5
                    py-1
                    text-[9px]
                    font-black
                    tracking-widest
                    text-orange-600
                    shadow-sm
                  "
                                >
                                    EDIT
                                </span>

                                <span
                                    className="
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-widest
                    text-orange-100
                  "
                                >
                                    Vehicle
                                </span>
                            </div>

                            <h2
                                className="
                  mt-1.5
                  truncate
                  text-xl
                  font-black
                  tracking-tight
                  text-white
                  sm:text-2xl
                  md:text-3xl
                "
                            >
                                {title}
                            </h2>

                            {subtitle && (
                                <p
                                    className="
                    mt-1
                    truncate
                    text-[11px]
                    font-medium
                    text-orange-100
                  "
                                >
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={closeDisabled}
                            aria-label="Close"
                            className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-white/20
                bg-white/10
                text-xl
                text-white
                backdrop-blur-sm
                transition-all
                duration-200
                hover:border-white/40
                hover:bg-white
                hover:text-orange-600
                hover:shadow-lg
                active:scale-95
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
                        >
                            ×
                        </button>
                    </div>

                    {/* Bottom line */}
                    <div
                        className="
              absolute
              bottom-0
              left-0
              h-[3px]
              w-full
              bg-gradient-to-r
              from-yellow-300
              via-white/70
              to-orange-900/30
            "
                    />
                </header>

                {/* CONTENT */}
                <main
                    className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            bg-gradient-to-b
            from-orange-50/30
            via-slate-100
            to-slate-100
          "
                >
                    {children}
                </main>

                {/* FOOTER */}
                {footer && (
                    <footer
                        className="
              shrink-0
              border-t
              border-orange-100
              bg-white
              px-4
              pt-3
              pb-[max(0.75rem,env(safe-area-inset-bottom))]
              sm:px-6
              sm:pb-3
            "
                    >
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
}