"use client";
import { useState } from "react";

export default function WebsiteBuilder() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBuild() {
    setLoading(true);
    try {
      const res = await fetch("/api/mvp_builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setResponse(data.result);
    } catch (err) {
      console.error("Error:", err);
    }
    setLoading(false);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI Website Builder</h1>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the website you want..."
        className="border px-3 py-2 w-full mb-4 rounded"
      />
      <button
        onClick={handleBuild}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Building..." : "Build Website"}
      </button>

      {response && (
        <div className="mt-6">
          <h2 className="font-semibold">Generated Website Code:</h2>
          <pre className="bg-gray-100 p-4 rounded mt-2 whitespace-pre-wrap">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}
