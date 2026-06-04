"use client";

import { useCallback, useState } from "react";

export function useCloudinaryPdfUpload() {
  const [fileUrl, setFileUrl] = useState("");
  const [loadings, setLoadings] = useState(false);

  const openUploads = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      setLoadings(true);

      const cloudinary = (window as any).cloudinary;

      if (!cloudinary) {
        setLoadings(false);
        reject(new Error("Cloudinary widget not loaded"));
        return;
      }

      const widget = cloudinary.createUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          uploadPreset: "GomtiInfra",
          resourceType: "raw",
          clientAllowedFormats: ["pdf"],
          maxFiles: 1,
        },
        (error: any, result: any) => {
          if (error) {
            setLoadings(false);
            reject(error);
            return;
          }

          if (result?.event === "success") {
            const url = result.info.secure_url;

            setFileUrl(url);
            setLoadings(false);

            resolve(url);
          }

          if (result?.event === "close") {
            setLoadings(false);
          }
        },
      );

      widget.open();
    });
  }, []);

  return {
    openUploads,
    fileUrl,
    loadings,
  };
}
