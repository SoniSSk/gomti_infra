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
      <label className="block text-sm font-medium">{label}</label>

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleUpload}
        className="block w-full rounded border p-2"
      />

      {loading && <p className="text-sm text-blue-600">Uploading...</p>}

      {fileUrl && (
        <div className="max-w-md space-y-3">
          {isPdf ? (
            <iframe
              src={fileUrl}
              title="PDF Preview"
              className="h-96 w-full rounded border"
            />
          ) : (
            <img
              src={fileUrl}
              alt="Uploaded File"
              className="w-full rounded border object-cover"
            />
          )}
        </div>
      )}
    </div>
  );
}
