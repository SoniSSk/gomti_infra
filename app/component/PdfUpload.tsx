"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";

interface CloudinaryUploadInfo {
  secure_url?: string;
  original_filename?: string;
  resource_type?: string;
  format?: string;
  public_id?: string;
}

export default function PdfUpload() {
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploadData, setUploadData] = useState<CloudinaryUploadInfo | null>(
    null,
  );

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">Cloudinary PDF Upload</h2>

      <CldUploadWidget
        uploadPreset="GomtiInfra"
        options={{
          resourceType: "raw",
          clientAllowedFormats: ["pdf"],
          maxFiles: 1,
        }}
        onSuccess={(result: any) => {
          const info = result?.info;

          if (!info) return;

          console.log("Cloudinary Response:", info);

          setUploadData(info);

          if (info.secure_url) {
            setPdfUrl(info.secure_url);
          }
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open()}
            className="px-5 py-2 cursor-pointer rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Upload PDF
          </button>
        )}
      </CldUploadWidget>

      {pdfUrl && (
        <div className="mt-8 space-y-6">
          {/* URL */}
          <div>
            <label className="block mb-2 font-medium">PDF URL</label>

            <input
              type="text"
              value={pdfUrl}
              readOnly
              className="w-full border rounded-md p-3"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded bg-green-600 text-white"
            >
              Open PDF
            </a>

            <button
              onClick={() => navigator.clipboard.writeText(pdfUrl)}
              className="px-4 py-2 cursor-pointer rounded bg-gray-700 text-white"
            >
              Copy URL
            </button>
          </div>

          {/* PDF Preview */}
          <div>
            <h3 className="font-semibold text-lg mb-3">PDF Preview</h3>

            <iframe
              src={pdfUrl}
              title="PDF Viewer"
              width="100%"
              height="700px"
              className="border rounded-lg"
            />
          </div>
        </div>
      )}

      {uploadData && (
        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-3">Upload Details</h3>

          <div className="border rounded-lg p-4 bg-gray-50">
            <p>
              <strong>File:</strong> {uploadData.original_filename}
            </p>

            <p>
              <strong>Public ID:</strong> {uploadData.public_id}
            </p>

            <p>
              <strong>Type:</strong> {uploadData.resource_type}
            </p>

            <p>
              <strong>Format:</strong> {uploadData.format}
            </p>
          </div>

          <pre className="mt-4 bg-black text-green-400 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(uploadData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
