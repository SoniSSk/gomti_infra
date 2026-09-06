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
}: FormFieldProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">
      {label}
    </label>

    <input
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`rounded-lg border p-3 focus:outline-none ${disabled
        ? "cursor-not-allowed border-gray-300 bg-gray-200 text-gray-500"
        : "border-gray-300 bg-white text-gray-900 focus:border-orange-500"
        }`}
    />
  </div>
);