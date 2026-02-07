"use client";

import React from "react";
import { motion } from "framer-motion";

export default function BlockIntroLoader({
  title,
  desc,
  focus,
}: {
  title: string;
  desc: string;
  focus: string[];
}) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900/10 transition-colors duration-300 px-4 pt-10 flex items-center justify-center">
      <div className="mx-auto max-w-md rounded-2xl glass dark:bg-slate-800/50 p-6 shadow-xl ring-1 ring-slate-200/50 dark:ring-slate-700/50 animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</div>
          <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-800 shadow-sm">
            2s
          </span>
        </div>

        <p className="mt-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">{desc}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {focus.slice(0, 5).map((x) => (
            <span
              key={x}
              className="rounded-full bg-slate-50 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 ring-1 ring-slate-200/50 dark:ring-slate-600/50"
            >
              {x}
            </span>
          ))}
        </div>

        {/* Modern loader line */}
        <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500"
            animate={{ x: ["-20%", "120%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Bouncing dots */}
        <div className="mt-4 flex items-center gap-2">
          <Dot delay={0} color="#6366f1" />
          <Dot delay={0.12} color="#10b981" />
          <Dot delay={0.24} color="#f59e0b" />
          <span className="ml-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Tayyorlanmoqda...</span>
        </div>

        <div className="mt-5 rounded-xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-800 p-3.5 text-xs text-slate-700 dark:text-slate-300 ring-1 ring-indigo-100 dark:ring-indigo-800/50 shadow-sm">
          Eslatma: Bu skrining tashxis emas. Natija sizga keyingi qadamlarni tushunarli qilib beradi.
        </div>
      </div>
    </div>
  );
}

function Dot({ delay, color }: { delay: number; color: string }) {
  return (
    <motion.div
      className="h-3 w-3 rounded-full"
      style={{ backgroundColor: color }}
      animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 0.7, repeat: Infinity, delay }}
    />
  );
}
