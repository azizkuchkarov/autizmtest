"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";

export default function HeroPreviewCharts() {
  // Demo data (faqat preview, real test natijasi emas)
  const overall = 52; // demo %
  const donut = [
    { name: "Risk", value: overall },
    { name: "Rest", value: 100 - overall },
  ];

  const radar = [
    { label: "Ijtimoiy", value: 11 },
    { label: "Muloqot", value: 13 },
    { label: "Takroriy", value: 8 },
    { label: "Sensor", value: 10 },
    { label: "O‘yin", value: 7 },
    { label: "Kundalik", value: 9 },
  ];

  const bars = [
    { label: "Ijtimoiy", v: 11 },
    { label: "Muloqot", v: 13 },
    { label: "Takroriy", v: 8 },
    { label: "Sensor", v: 10 },
    { label: "O‘yin", v: 7 },
    { label: "Kundalik", v: 9 },
  ];

  return (
    <div className="rounded-2xl glass dark:bg-slate-800/50 p-5 shadow-md ring-1 ring-slate-200/50 dark:ring-slate-700/50 hover-lift">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100">Natija preview</div>
          <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
            Testdan so'ng shunga o'xshash grafik profil ko'rasiz
          </div>
        </div>

        <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-100 dark:ring-emerald-800 shadow-sm">
          Demo
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Mini Donut */}
        <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 p-3 ring-1 ring-slate-200/50 dark:ring-slate-700/50 shadow-sm">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Umumiy risk</div>
          <div className="mt-2 h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donut}
                  innerRadius={26}
                  outerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#E2E8F0" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="-mt-20 text-center">
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">{overall}%</div>
              <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">preview</div>
            </div>
          </div>
        </div>

        {/* Mini Radar */}
        <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 p-3 ring-1 ring-slate-200/50 dark:ring-slate-700/50 shadow-sm">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Profil</div>
          <div className="mt-2 h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="label" tick={{ fontSize: 10 }} />
                <Radar
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#818cf8"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mini blocks */}
      <div className="mt-4 rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 p-3 ring-1 ring-slate-200/50 dark:ring-slate-700/50 shadow-sm">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">6 blok bo'yicha</div>
        <div className="mt-2 space-y-2">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{b.label}</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{b.v}/18</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500"
                  style={{ width: `${Math.round((b.v / 18) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-800 p-3.5 text-xs font-semibold text-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-800/50 shadow-sm">
        Natija: grafik + AI izoh + PDF hisobot (ota-onaga yumshoq tilda).
      </div>
    </div>
  );
}
