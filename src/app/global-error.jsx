"use client";

import React from "react";

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md text-center border border-gray-200">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Application Error</h2>
          <p className="text-gray-600 mb-6 text-sm">
            {error?.message || "A critical error occurred."}
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] font-medium text-sm transition-colors"
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
