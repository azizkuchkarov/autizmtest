"use client";

import React from "react";

export default function AdminLogs() {
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch("/api/admin/logs")
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []));
  }, []);

  return (
    <div>
      <div className="text-2xl font-bold text-slate-900">Loglar</div>
      <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Vaqt</th>
              <th>Tur</th>
              <th>Metadata</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-slate-100">
                <td className="py-2">{new Date(it.createdAt).toLocaleString()}</td>
                <td>{it.type}</td>
                <td className="text-xs text-slate-500">{JSON.stringify(it.metadata ?? {})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
