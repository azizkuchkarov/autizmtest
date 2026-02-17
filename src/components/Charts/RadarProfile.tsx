"use client";

import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";

export type RadarPoint = { label: string; value: number; fullMark?: number };

type RadarProfileProps = {
  data: RadarPoint[];
  title?: string;
  className?: string;
  color?: string;
};

const DEFAULT_FULL_MARK = 18;

export default function RadarProfile({
  data,
  title,
  className = "",
  color = "#6366f1",
}: RadarProfileProps) {
  const chartData = data.map((d) => ({
    subject: d.label,
    value: d.value,
    fullMark: d.fullMark ?? DEFAULT_FULL_MARK,
  }));

  return (
    <div className={className}>
      {title && (
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
          {title}
        </div>
      )}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
            <defs>
              <linearGradient id="radar-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <PolarGrid
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-600"
              strokeOpacity={0.6}
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "currentColor", fontSize: 11 }}
              className="text-slate-600 dark:text-slate-400"
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, DEFAULT_FULL_MARK]}
              tick={{ fill: "currentColor", fontSize: 10 }}
              className="text-slate-400 dark:text-slate-500"
            />
            <Radar
              name="Ball"
              dataKey="value"
              stroke={color}
              fill="url(#radar-fill)"
              strokeWidth={2}
              animationDuration={600}
              animationBegin={0}
            />
            <Tooltip
              content={({ payload }) =>
                payload?.[0] ? (
                  <div className="rounded-xl bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium shadow-lg ring-1 ring-slate-200/60 dark:ring-slate-700/60">
                    <span className="text-slate-600 dark:text-slate-400">{payload[0].payload.subject}:</span>{" "}
                    <span className="font-bold">{payload[0].value}</span> / {DEFAULT_FULL_MARK}
                  </div>
                ) : null
              }
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
