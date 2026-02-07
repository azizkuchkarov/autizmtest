"use client";

import React from "react";

export default function AdminDashboard() {
  const [metrics, setMetrics] = React.useState<any>(null);

  React.useEffect(() => {
    fetch("/api/admin/metrics")
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="text-2xl font-bold text-slate-900">Dashboard</div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Test ochilgan" value={metrics?.totalTests ?? "-"} />
        <Card title="PDF yuklab olingan" value={metrics?.totalPdf ?? "-"} />
        <Card title="So‘nggi 7 kun loglari" value={(metrics?.last7?.length ?? 0).toString()} />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
