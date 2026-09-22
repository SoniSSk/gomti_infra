"use client";

import React from "react";

export interface SelectOption {
    label: string;
    value: string;
}

export interface CommonSelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
    containerClassName?: string;
}

const CommonSelect = React.forwardRef<
    HTMLSelectElement,
    CommonSelectProps
>(
    (
        {
            label,
            error,
            options,
            placeholder = "Select an option",
            containerClassName = "",
            className = "",
            ...props
        },
        ref
    ) => {
        return (
            <div className={`w-full ${containerClassName}`}>
                {/* Label */}
                {label && (
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        {label}
                    </label>
                )}

                {/* Select */}
                <select
                    ref={ref}
                    {...props}
                    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${error
                            ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                            : "border-gray-300 focus:border-orange-500 focus:ring-orange-100"
                        } ${className}`}
                >
                    {/* Placeholder */}
                    <option value="" disabled>
                        {placeholder}
                    </option>

                    {/* Options */}
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>

                {/* Error */}
                {error && (
                    <p className="mt-1 text-xs text-red-500">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

CommonSelect.displayName = "CommonSelect";

export default CommonSelect;