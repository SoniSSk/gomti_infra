interface UploadButtonProps {
  url?: string;
  label: string;
  onClick: () => void;
}

export const UploadButton = ({ url, label, onClick }: UploadButtonProps) => {
  const isPdf = url?.toLowerCase().includes(".pdf");

  const handlePreviewClick = () => {
    if (!url) return;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Upload Button */}
      <button
        type="button"
        onClick={onClick}
        className={`w-full cursor-pointer rounded-lg px-4 py-2 text-center font-medium text-white shadow-sm transition-colors duration-200 ${
          url
            ? "bg-green-600 hover:bg-green-700 active:bg-green-800"
            : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
        }`}
      >
        {url ? `Change ${label}` : `Upload ${label}`}
      </button>

      {/* Preview */}
      {url && (
        <div
          onClick={handlePreviewClick}
          className="group relative h-[200px] w-full cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
        >
          {isPdf ? (
            <>
              <iframe
                src={url}
                title={label}
                className="pointer-events-none h-full w-full"
              />

              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                <span className="rounded-md bg-white px-3 py-1 text-sm font-medium opacity-0 shadow transition-opacity group-hover:opacity-100">
                  Open PDF
                </span>
              </div>
            </>
          ) : (
            <>
              <img
                src={url}
                alt={label}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                <span className="rounded-md bg-white px-3 py-1 text-sm font-medium opacity-0 shadow transition-opacity group-hover:opacity-100">
                  View Image
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
