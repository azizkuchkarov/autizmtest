"use client";

import React, { useId } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

export type RiskTier = "LOW" | "WATCH" | "MODERATE" | "HIGH";

const RISK_COLORS: Record<RiskTier, [string, string]> = {
  LOW: ["#10b981", "#34d399"],
  WATCH: ["#f59e0b", "#fbbf24"],
  MODERATE: ["#f97316", "#fb923c"],
  HIGH: ["#ef4444", "#f87171"],
};

type DonutRiskProps = {
  value: number;
  tier?: RiskTier;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function DonutRisk({
  value,
  tier = "WATCH",
  label = "Risk",
  size = "md",
  className = "",
}: DonutRiskProps) {
  const id = useId().replace(/:/g, "");
  const gradientId = `donut-risk-gradient-${id}`;
  const shadowId = `donut-shadow-${id}`;
  const [primary, secondary] = RISK_COLORS[tier];
  const data = [
    { name: "Risk", value, fill: primary },
    { name: "Rest", value: 100 - value, fill: "var(--color-slate-200, #e2e8f0)" },
  ];

  const dim = size === "sm" ? 120 : size === "lg" ? 200 : 160;
  const innerR = size === "sm" ? 36 : size === "lg" ? 64 : 48;
  const outerR = size === "sm" ? 52 : size === "lg" ? 92 : 72;
  const fontSize = size === "sm" ? "1rem" : size === "lg" ? "2rem" : "1.5rem";

  return (
    <div className={`relative ${className}`} style={{ width: dim, height: dim }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={primary} />
              <stop offset="100%" stopColor={secondary} />
            </linearGradient>
            <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerR}
            outerRadius={outerR}
            paddingAngle={2}
            stroke="none"
            startAngle={90}
            endAngle={-270}
            animationDuration={800}
            animationBegin={0}
          >
            <Cell fill={`url(#${gradientId})`} filter={`url(#${shadowId})`} />
            <Cell fill="currentColor" className="text-slate-200 dark:text-slate-700" />
          </Pie>
          <Tooltip
            content={({ payload }) =>
              payload?.[0] ? (
                <div className="rounded-xl bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium shadow-lg ring-1 ring-slate-200/60 dark:ring-slate-700/60">
                  {payload[0].value}%
                </div>
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ fontSize }}
      >
        <span className="font-black tabular-nums tracking-tight text-slate-900 dark:text-slate-100 drop-shadow-sm">
          {value}%
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">
          {label}
        </span>
      </div>
    </div>
  );
}
