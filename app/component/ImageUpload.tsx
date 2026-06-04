"use client";

import { CldUploadWidget } from "next-cloudinary";
import { useState } from "react";

export default function ImageUpload() {
  const [imageUrl, setImageUrl] = useState("");

  return (
    <div>
      <CldUploadWidget
        uploadPreset="GomtiInfra"
        onSuccess={(result: any) => {
          console.log("Cloudinary Result:", result);

          const url = result?.info?.secure_url;

          if (url) {
            setImageUrl(url);
            console.log("Image URL:", url);
          }
        }}
      >
        {({ open }) => (
          <button onClick={() => open()} className="cursor-pointer">
            Upload Image
          </button>
        )}
      </CldUploadWidget>

      {imageUrl && (
        <div style={{ marginTop: "20px" }}>
          <p>
            <strong>Image URL:</strong>
          </p>

          <input
            value={imageUrl}
            readOnly
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
            }}
          />

          <img
            src={imageUrl}
            alt="Uploaded"
            width={300}
            style={{ marginTop: "10px" }}
          />
        </div>
      )}
    </div>
  );
}
