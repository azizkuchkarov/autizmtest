"use client";

import React from "react";

interface AchievementBadgeProps {
  type: "completed" | "progress" | "milestone";
  label: string;
  icon?: React.ReactNode;
}

export default function AchievementBadge({ type, label, icon }: AchievementBadgeProps) {
  const styles = {
    completed: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white ring-emerald-200 dark:ring-emerald-800",
    progress: "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white ring-indigo-200 dark:ring-indigo-800",
    milestone: "bg-gradient-to-r from-amber-500 to-amber-600 text-white ring-amber-200 dark:ring-amber-800",
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ring-1 shadow-md animate-scaleIn ${styles[type]}`}>
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </div>
  );
}
