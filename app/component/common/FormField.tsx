interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
}

export const FormField = ({ label, name, value, onChange }: FormFieldProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>

    <input
      name={name}
      value={value}
      onChange={onChange}
      className="rounded-lg border border-gray-300 p-3 focus:border-orange-500 focus:outline-none"
    />
  </div>
);
