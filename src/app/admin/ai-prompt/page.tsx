"use client";

import React from "react";

export default function AdminAiPrompt() {
  const [value, setValue] = React.useState("");
  const [status, setStatus] = React.useState("");

  React.useEffect(() => {
    fetch("/api/admin/ai-prompt")
      .then((r) => r.json())
      .then((data) => setValue(String(data.prompt ?? "")));
  }, []);

  async function save() {
    setStatus("Saqlanmoqda...");
    const res = await fetch("/api/admin/ai-prompt", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: value }),
    });
    setStatus(res.ok ? "Saqlandi" : "Xatolik");
  }

  return (
    <div>
      <div className="text-2xl font-bold text-slate-900">AI Prompt</div>
      <p className="mt-1 text-sm text-slate-600">AI xulosa promptini tahrirlash.</p>
      <textarea
        className="mt-4 w-full min-h-[360px] rounded-xl border border-slate-300 p-3 text-xs font-mono"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
          Saqlash
        </button>
        <div className="text-sm text-slate-600">{status}</div>
      </div>
    </div>
  );
}
