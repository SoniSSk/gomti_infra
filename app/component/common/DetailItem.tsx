interface DetailItemProps {
  label: string;
  value?: React.ReactNode;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>

      <p className="break-words text-sm font-medium text-gray-900">
        {value ?? <span className="italic text-gray-400">Not Available</span>}
      </p>
    </div>
  );
};

export default DetailItem;
