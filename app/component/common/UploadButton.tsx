"use client";

import { useState } from "react";

interface FileUploadProps {
  url?: string;
  label: string;
  onClick: () => void;
}

export default function FileUpload({ url, label, onClick }: FileUploadProps) {
  const [fileUrl, setFileUrl] = useState(url || "");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setLoading(true);
      setFileUrl("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        const uploadedUrl = `${data.url}?t=${Date.now()}`;
        setFileUrl(uploadedUrl);

        console.log("Uploaded URL:", uploadedUrl);
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
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleUpload}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
        className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white file:hover:bg-blue-700"
      />

      {loading && (
        <div className="mt-4 flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm text-blue-600">Uploading...</span>
        </div>
      )}

      {fileUrl && (
        <div className="mt-6 space-y-4">
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
