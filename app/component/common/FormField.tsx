
import React from "react";

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  disabled?: boolean;
}

export const FormField = ({
  label,
  name,
  value,
  onChange,
  disabled = false,
}: FormFieldProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const upperCaseValue = e.target.value.toUpperCase();

    // Create a new event with the uppercase value
    const newEvent = {
      ...e,
      target: {
        ...e.target,
        value: upperCaseValue,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(newEvent);
  };

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={name}
        className="text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={`rounded-lg border p-3 uppercase focus:outline-none ${disabled
          ? "cursor-not-allowed border-gray-300 bg-gray-200 text-gray-500"
          : "border-gray-300 bg-white text-gray-900 focus:border-orange-500"
          }`}
      />
    </div>
  );
};
