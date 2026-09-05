"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface FileUploadProps {
  url?: string;
  label: string;
  onUpload: (url: string) => void;
  disabled?: boolean;
}

export default function FileUpload({
  url,
  label,
  onUpload,
  disabled = false,
}: FileUploadProps) {
  const [fileUrl, setFileUrl] = useState(url || "");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (disabled) {
      e.target.value = "";
      return;
    }

    const file = e.target.files?.[0];

    if (!file) return;

    // 100 MB limit
    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("Video/file size must be less than 100 MB");
      e.target.value = "";
      return;
    }

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
        onUpload(uploadedUrl);

        console.log("Uploaded URL:", uploadedUrl);
      } else {
        console.error(data.error || "Upload failed");
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const lowerUrl = fileUrl.toLowerCase();

  const isPdf = lowerUrl.includes(".pdf");

  const isVideo =
    lowerUrl.includes(".mp4") ||
    lowerUrl.includes(".webm") ||
    lowerUrl.includes(".mov") ||
    lowerUrl.includes(".avi");

  return (
    <div className="space-y-4">

      {/* LABEL */}
      <label className="mb-3 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      {/* UPLOAD BUTTON */}
      <label
        className={`
          flex w-full items-center justify-center
          rounded-xl border-2 border-dashed p-4
          text-sm font-medium transition

          ${disabled
            ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400"
            : fileUrl
              ? "cursor-pointer border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
              : "cursor-pointer border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
          }
        `}
      >
        {disabled
          ? "File Upload Disabled"
          : loading
            ? "Uploading..."
            : fileUrl
              ? "Change File"
              : "Upload File"}

        <input
          type="file"
          accept="image/*,.pdf,video/*"
          capture="environment"
          onChange={handleUpload}
          disabled={disabled || loading}
          className="hidden"
        />
      </label>

      {/* DISABLED MESSAGE */}
      {disabled && (
        <p className="text-xs text-gray-500">
          You do not have permission to change this file.
        </p>
      )}

      {/* LOADING */}
      {loading && !disabled && (
        <p className="text-sm text-blue-600">
          Uploading file...
        </p>
      )}

      {/* FILE PREVIEW */}
      {fileUrl && (
        <div
          className={`
            max-w-md overflow-hidden rounded-xl
            border border-gray-200 bg-white shadow-sm
            transition
            ${disabled
              ? "cursor-default"
              : "cursor-pointer hover:shadow-md"
            }
          `}
          onClick={() => {
            if (!disabled) {
              window.open(fileUrl, "_blank");
            }
          }}
        >
          {/* VIDEO */}
          {isVideo ? (
            <video
              src={fileUrl}
              controls
              className="h-[400px] w-full rounded-xl object-cover"
              onClick={(e) => e.stopPropagation()}
            />
          ) : isPdf ? (
            /* PDF */
            <iframe
              key={fileUrl}
              src={fileUrl}
              title={`${label} PDF Preview`}
              className="pointer-events-none h-[400px] w-full rounded-xl border-0"
            />
          ) : (
            /* IMAGE */
            <img
              src={fileUrl}
              alt={label}
              className="h-[400px] w-full object-cover"
            />
          )}
        </div>
      )}
    </div>
  );
}