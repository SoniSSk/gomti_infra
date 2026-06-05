"use client";

import { useState } from "react";

interface FileUploadProps {
  url?: string;
  label: string;
  onUpload: (url: string) => void;
}

export default function FileUpload({ url, label, onUpload }: FileUploadProps) {
  const [fileUrl, setFileUrl] = useState(url || "");
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
        const uploadedUrl = data.url;

        setFileUrl(uploadedUrl);

        // Update parent form
        onUpload(uploadedUrl);

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

  const isPdf = fileUrl.toLowerCase().includes(".pdf");

  return (
    <div className="space-y-4">
      <label className="mb-3 block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <label
        className={`
    flex w-full cursor-pointer items-center justify-center
    rounded-xl border-2 border-dashed p-4 text-sm font-medium
    transition
    ${
      fileUrl
        ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
        : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
    }
  `}
      >
        {fileUrl ? "Change File" : "Upload File"}

        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleUpload}
          className="hidden"
        />
      </label>
      {loading && <p className="text-sm text-blue-600">Uploading...</p>}

      {fileUrl && (
        <div
          className="max-w-md cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
          onClick={() => window.open(fileUrl, "_blank")}
        >
          {isPdf ? (
            <iframe
              key={fileUrl}
              src={fileUrl}
              title="PDF Preview"
              className="h-[400px] w-full rounded-xl border-0 pointer-events-none"
            />
          ) : (
            <img
              src={fileUrl}
              alt="Uploaded File"
              className="h-[400px] w-full object-cover"
            />
          )}
        </div>
      )}
    </div>
  );
}
