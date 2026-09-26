import React from "react";
import type { LucideIcon } from "lucide-react";

/*
 * Building blocks for modal bodies so View / Edit / Add modals
 * share one layout language.
 */

/* =========================================================
   SECTION
========================================================= */

export interface ModalSectionProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    /** Right-aligned header content (count, button). */
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const ModalSection = ({
    title,
    description,
    icon: Icon,
    action,
    children,
    className = "",
}: ModalSectionProps) => (
    <section className={`rounded-xl border border-gray-200 bg-white ${className}`}>
        <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
                {Icon && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                )}

                <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-gray-900">
                        {title}
                    </h3>

                    {description && (
                        <p className="truncate text-xs text-gray-500">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {action}
        </header>

        <div className="p-4">{children}</div>
    </section>
);

/* =========================================================
   DETAIL GRID / ITEM
========================================================= */

export const DetailGrid = ({
    children,
    columns = 2,
}: {
    children: React.ReactNode;
    columns?: 2 | 3;
}) => (
    <dl
        className={`grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}
    >
        {children}
    </dl>
);

export const isEmptyValue = (value: unknown) =>
    value === undefined || value === null || value === "";

export interface DetailItemProps {
    label: string;
    value?: React.ReactNode;
    /** Span both columns (long text such as addresses). */
    wide?: boolean;
    /** Right-aligned extra (e.g. copy button). */
    action?: React.ReactNode;
    mono?: boolean;
}

export const DetailItem = ({
    label,
    value,
    wide = false,
    action,
    mono = false,
}: DetailItemProps) => (
    <div className={`min-w-0 ${wide ? "sm:col-span-full" : ""}`}>
        <dt className="text-xs font-medium text-gray-500">{label}</dt>

        <dd className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-gray-900">
            <span
                className={`min-w-0 break-words ${mono ? "font-mono text-[13px]" : ""}`}
            >
                {isEmptyValue(value) ? (
                    <span className="text-gray-300">—</span>
                ) : (
                    value
                )}
            </span>

            {!isEmptyValue(value) && action}
        </dd>
    </div>
);

/* =========================================================
   EMPTY NOTE
========================================================= */

export const EmptyNote = ({ children }: { children: React.ReactNode }) => (
    <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
        {children}
    </p>
);

/* =========================================================
   FORM FIELD WRAPPER (label + hint + error)
========================================================= */

export interface FormFieldProps {
    label: string;
    htmlFor?: string;
    required?: boolean;
    hint?: React.ReactNode;
    error?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

export const FormField = ({
    label,
    htmlFor,
    required = false,
    hint,
    error,
    className = "",
    children,
}: FormFieldProps) => (
    <div className={`min-w-0 ${className}`}>
        <label
            htmlFor={htmlFor}
            className="mb-1.5 block text-sm font-medium text-gray-700"
        >
            {label}
            {required && (
                <span className="ml-0.5 text-red-500" aria-hidden="true">
                    *
                </span>
            )}
        </label>

        {children}

        {error ? (
            <p className="mt-1 text-xs text-red-600">{error}</p>
        ) : (
            hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>
        )}
    </div>
);

/** Shared input / select look (matches CommonInput). */
export const FIELD_CLASS =
    "h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";
