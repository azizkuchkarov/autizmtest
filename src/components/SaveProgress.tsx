"use client";

import React from "react";
import { type AnswerValue, type AnswersMap } from "@/lib/scoring";

interface SaveProgressProps {
  answers: AnswersMap;
  currentIndex: number;
  totalQuestions: number;
}

export default function SaveProgress({ answers, currentIndex, totalQuestions }: SaveProgressProps) {
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    // Auto-save every 5 seconds
    const interval = setInterval(() => {
      try {
        localStorage.setItem("asds_progress", JSON.stringify({
          answers,
          currentIndex,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.error("Failed to save progress:", e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [answers, currentIndex]);

  const handleManualSave = () => {
    try {
      localStorage.setItem("asds_progress", JSON.stringify({
        answers,
        currentIndex,
        timestamp: Date.now(),
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save progress:", e);
    }
  };

  const progress = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleManualSave}
        className="flex items-center gap-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 ring-1 ring-slate-200/50 dark:ring-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover-lift"
        title="Saqlash"
      >
        {saved ? (
          <>
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Saqlandi</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>Saqlash</span>
          </>
        )}
      </button>
      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 font-semibold">
        {progress}%
      </div>
    </div>
  );
}

function normalizeAnswers(raw: unknown): AnswersMap {
  if (!raw || typeof raw !== "object") return {};

  const out: AnswersMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === 0 || value === 1 || value === 2 || value === 3) {
      out[key] = value as AnswerValue;
    }
  }

  return out;
}

export function loadProgress(): { answers: AnswersMap; currentIndex: number } | null {
  try {
    const saved = localStorage.getItem("asds_progress");
    if (saved) {
      const data = JSON.parse(saved);
      // Check if saved data is less than 24 hours old
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return { answers: normalizeAnswers(data.answers), currentIndex: data.currentIndex };
      }
    }
  } catch (e) {
    console.error("Failed to load progress:", e);
  }
  return null;
}
