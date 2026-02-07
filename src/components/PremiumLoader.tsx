"use client";

import React from "react";

export default function PremiumLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        {/* Spinning ring */}
        <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
        {/* Inner pulse */}
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 dark:border-t-indigo-500 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1s" }}></div>
      </div>
    </div>
  );
}
