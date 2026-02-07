"use client";

import React from "react";

export default function AdminQuestions() {
  const [value, setValue] = React.useState("");
  const [status, setStatus] = React.useState("");

  React.useEffect(() => {
    fetch("/api/admin/questions")
      .then((r) => r.json())
      .then((data) => setValue(JSON.stringify(data.items ?? [], null, 2)));
  }, []);

  async function save() {
    setStatus("Saqlanmoqda...");
    const res = await fetch("/api/admin/questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: JSON.parse(value) }),
    });
    setStatus(res.ok ? "Saqlandi" : "Xatolik");
  }

  return (
    <div>
      <div className="text-2xl font-bold text-slate-900">Savollar (JSON)</div>
      <p className="mt-1 text-sm text-slate-600">Savollarni JSON ko‘rinishida tahrirlaysiz.</p>
      <textarea
        className="mt-4 w-full min-h-[420px] rounded-xl border border-slate-300 p-3 text-xs font-mono"
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
