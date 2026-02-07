"use client";

import React from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

export function DonutRisk({ value }: { value: number }) {
  const data = [
    { name: "Risk", value },
    { name: "Rest", value: Math.max(0, 100 - value) },
  ];

  const colors = ["#6366f1", "#E2E8F0"]; // indigo + slate-200

  return (
    <div className="h-44 w-full pdf-color">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={52}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="-mt-28 text-center donut-label">
        <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{value}%</div>
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Umumiy risk</div>
      </div>
    </div>
  );
}

export function RadarBlocks({
  points,
}: {
  points: { label: string; value: number }[];
}) {
  // value: 0..18
  return (
    <div className="h-72 w-full radar-wrap pdf-color">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={points}>
          <PolarGrid stroke="#cbd5e1" className="dark:stroke-slate-600" />
          <PolarAngleAxis 
            dataKey="label" 
            tick={{ fontSize: 12, fill: 'currentColor' }} 
            className="text-slate-700 dark:text-slate-300"
          />
          <Radar 
            dataKey="value" 
            stroke="#6366f1" 
            fill="#818cf8" 
            fillOpacity={0.4}
            className="dark:stroke-indigo-400 dark:fill-indigo-500"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
