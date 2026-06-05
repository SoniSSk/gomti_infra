"use client";

import { useState } from "react";

interface FileUploadProps {
  url?: string;
  label: string;
}

export default function FileUpload({ url = "", label }: FileUploadProps) {
  const [fileUrl, setFileUrl] = useState(url);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setFileUrl(`${data.url}?t=${Date.now()}`);
      } else {
        console.error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const isPdf = fileUrl?.toLowerCase().includes(".pdf");

  return (
    <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Label */}
      <label className="mb-3 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      {/* Upload / Change Button */}
      <label
        className={`inline-flex cursor-pointer items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
          fileUrl
            ? "bg-orange-600 hover:bg-orange-700"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {fileUrl ? "Change Slip" : "Upload File"}

        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleUpload}
          onClick={(e) => {
            (e.target as HTMLInputElement).value = "";
          }}
          className="hidden"
        />
      </label>

      {/* File Name */}
      {fileUrl && (
        <p className="mt-2 break-all text-sm text-gray-500">
          {fileUrl.split("/").pop()?.split("?")[0]}
        </p>
      )}

      {/* Loader */}
      {loading && (
        <div className="mt-4 flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm text-blue-600">Uploading...</span>
        </div>
      )}

      {/* Preview */}
      {fileUrl && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Preview</h3>

            <button
              type="button"
              onClick={() => window.open(fileUrl, "_blank")}
              className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
            >
              Open Full File
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            {isPdf ? (
              <iframe
                key={fileUrl}
                src={fileUrl}
                title="PDF Preview"
                className="h-[500px] w-full"
              />
            ) : (
              <img
                key={fileUrl}
                src={fileUrl}
                alt="Uploaded File"
                className="max-h-[500px] w-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
