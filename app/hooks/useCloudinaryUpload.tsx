"use client";

import { useState, useCallback } from "react";

declare global {
  interface Window {
    cloudinary: any;
  }
}

export function useCloudinaryUpload() {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const openUpload = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.cloudinary) {
        reject(new Error("Cloudinary script not loaded"));
        return;
      }

      setLoading(true);

      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          uploadPreset: "GomtiInfra",
          multiple: false,
        },
        (error: any, result: any) => {
          if (error) {
            setLoading(false);
            reject(error);
            return;
          }

          if (result?.event === "success") {
            const url = result.info.secure_url;

            setImageUrl(url);
            setLoading(false);

            resolve(url);
          }

          if (result?.event === "close") {
            setLoading(false);
          }
        },
      );

      widget.open();
    });
  }, []);

  return {
    imageUrl,
    loading,
    openUpload,
  };
}
