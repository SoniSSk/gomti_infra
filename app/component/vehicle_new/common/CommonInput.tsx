"use client";

import React from "react";

export interface CommonInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

const CommonInput = React.forwardRef<
  HTMLInputElement,
  CommonInputProps
>(
  (
    {
      label,
      error,
      containerClassName = "",
      className = "",
      name,
      id,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`w-full ${containerClassName}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id || name}
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={id || name}
          name={name}
          {...props}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${error
              ? "border-red-500 focus:border-red-500 focus:ring-red-100"
              : "border-gray-300 focus:border-orange-500 focus:ring-orange-100"
            } ${className}`}
        />

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

CommonInput.displayName = "CommonInput";

export default CommonInput;