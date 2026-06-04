"use client";

import { useState } from "react";

export default function TestMongo() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkConnection = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/test-db");
      const data = await res.json();

      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to connect",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">MongoDB Connection Test</h2>

      <button
        onClick={checkConnection}
        className="px-4 py-2 bg-black text-white rounded"
      >
        {loading ? "Checking..." : "Check Connection"}
      </button>

      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
