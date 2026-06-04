interface FilePreviewProps {
  label: string;
  url?: string;
}

export default function FilePreview({ label, url }: FilePreviewProps) {
  if (!url) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold text-gray-700">{label}</h3>
        <span className="text-gray-500">No file available</span>
      </div>
    );
  }

  const isPdf = url.toLowerCase().includes(".pdf");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <h3 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </h3>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block cursor-pointer"
      >
        {isPdf ? (
          <div className="flex justify-center">
            <iframe
              src={url}
              title={label}
              className="h-[300px] w-[500px] rounded-lg border-rounded border border-gray-200 pointer-events-none"
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <img
              src={url}
              alt={label}
              className="h-[300px] w-[500px] rounded-lg border-rounded border border-gray-200 object-contain transition-opacity hover:opacity-90"
            />
          </div>
        )}
      </a>
    </div>
  );
}
