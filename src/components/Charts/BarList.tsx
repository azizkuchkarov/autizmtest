"use client";

import React from "react";

export type BarListItem = {
  label: string;
  value: number;
  max?: number;
  color?: "indigo" | "emerald" | "amber" | "rose" | "slate";
};

const COLOR_CLASSES: Record<NonNullable<BarListItem["color"]>, string> = {
  indigo:
    "bg-gradient-to-r from-indigo-500 to-indigo-400 dark:from-indigo-500 dark:to-indigo-400",
  emerald:
    "bg-gradient-to-r from-emerald-500 to-emerald-400 dark:from-emerald-500 dark:to-emerald-400",
  amber:
    "bg-gradient-to-r from-amber-500 to-amber-400 dark:from-amber-500 dark:to-amber-400",
  rose: "bg-gradient-to-r from-rose-500 to-rose-400 dark:from-rose-500 dark:to-rose-400",
  slate:
    "bg-gradient-to-r from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-400",
};

type BarListProps = {
  data: BarListItem[];
  title?: string;
  maxValue?: number;
  showValue?: boolean;
  className?: string;
};

export default function BarList({
  data,
  title,
  maxValue: globalMax,
  showValue = true,
  className = "",
}: BarListProps) {
  const maxVal =
    globalMax ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={className}>
      {title && (
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
          {title}
        </div>
      )}
      <div className="space-y-4">
        {data.map((item, i) => {
          const max = item.max ?? maxVal;
          const pct = max > 0 ? Math.min(100, (item.value / max) * 100) : 0;
          const color = item.color ?? "indigo";
          const barClass = COLOR_CLASSES[color];
          return (
            <div key={i} className="group">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                  {item.label}
                </span>
                {showValue && (
                  <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100 shrink-0">
                    {item.value}
                    {max !== 100 && typeof max === "number" && (
                      <span className="text-slate-500 dark:text-slate-400 font-normal">
                        /{max}
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                <div
                  className={`h-full rounded-full ${barClass} transition-all duration-500 ease-out min-w-[4px]`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
