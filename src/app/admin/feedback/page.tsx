"use client";

import React from "react";

export default function AdminFeedback() {
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch("/api/admin/feedback")
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []));
  }, []);

  return (
    <div>
      <div className="text-2xl font-bold text-slate-900">Feedback</div>
      <div className="mt-4 space-y-3">
        {items.map((it) => (
          <div key={it.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="text-xs text-slate-500">{new Date(it.createdAt).toLocaleString()}</div>
            <div className="text-sm font-semibold text-slate-900 mt-1">
              {it.name || "Anonim"} {it.phone ? `• ${it.phone}` : ""}
            </div>
            <div className="mt-2 text-sm text-slate-700 whitespace-pre-line">{it.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
