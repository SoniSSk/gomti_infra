"use client";

import { useState } from "react";

export default function CloudinaryStatus() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/cloudinary-status");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setData({
        success: false,
        message: "Connection Failed",
      });
    }

    setLoading(false);
  };

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Cloudinary Connection Test</h2>

      <button
        onClick={checkStatus}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Checking..." : "Check Cloudinary"}
      </button>

      {data && (
        <pre className="mt-4 bg-gray-100 p-4 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
