"use client";

import { useState } from "react";

interface UploadImageProps {
  onOpen?: (file: File) => void;
  initialImage?: string;
}

export default function UploadImage({
  onOpen,
  initialImage,
}: UploadImageProps) {
  const [image, setImage] = useState<string | null>(initialImage || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setImage(previewUrl);

    onOpen?.(file);
  };

  return (
    <div className="flex flex-col gap-3">
      {image && (
        <img
          src={image}
          alt="Preview"
          className="h-40 w-full rounded-lg border object-cover"
        />
      )}

      <label className="cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="rounded-md bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700">
          {image ? "Change Data" : "Upload Data"}
        </div>
      </label>
    </div>
  );
}
