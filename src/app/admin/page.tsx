"use client";

import React from "react";

type Metrics = {
  totalTests?: number;
  totalPdf?: number;
  last7?: { type: string; _count: { type: number } }[];
  payments?: {
    totalCount: number;
    totalAmount: number;
    recent: {
      id: string;
      phone: string;
      amount: number;
      status: string;
      merchantTransId: string;
      createdAt: string;
      paidAt: string | null;
    }[];
  };
  adminLogins?: { email: string; createdAt: string }[];
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so‘m";
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = React.useState<Metrics | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/metrics")
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-2xl font-bold text-slate-900">Dashboard</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Test ochilgan" value={metrics?.totalTests != null ? String(metrics.totalTests) : "-"} />
        <Card title="PDF yuklab olingan" value={metrics?.totalPdf != null ? String(metrics.totalPdf) : "-"} />
        <Card
          title="To‘lovlar (jami)"
          value={
            metrics?.payments
              ? `${metrics.payments.totalCount} ta · ${formatMoney(metrics.payments.totalAmount)}`
              : "-"
          }
        />
        <Card
          title="Admin kirishlari"
          value={
            metrics?.adminLogins != null
              ? `${metrics.adminLogins.length} ta (so‘nggi 50)`
              : "-"
          }
        />
      </div>

      {/* Kim kiryapti — admin logins */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Kim kiryapti (admin kirishlari)</h2>
        {metrics?.adminLogins?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="pb-2 pr-4 font-semibold">Email</th>
                  <th className="pb-2 font-semibold">Sana va vaqt</th>
                </tr>
              </thead>
              <tbody>
                {metrics.adminLogins.map((e) => (
                  <tr key={`${e.email}-${e.createdAt}`} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-900">{e.email}</td>
                    <td className="py-2 text-slate-600">{formatDate(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Ma’lumot yo‘q</p>
        )}
      </section>

      {/* To‘lovlar ro‘yxati */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-4">To‘lovlar (so‘nggi 50)</h2>
        {metrics?.payments?.recent?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="pb-2 pr-4 font-semibold">Telefon</th>
                  <th className="pb-2 pr-4 font-semibold">Summa</th>
                  <th className="pb-2 pr-4 font-semibold">To‘langan sana</th>
                  <th className="pb-2 font-semibold">Tranzaksiya</th>
                </tr>
              </thead>
              <tbody>
                {metrics.payments.recent.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-900">{p.phone}</td>
                    <td className="py-2 pr-4 font-medium text-slate-900">
                      {formatMoney(p.amount)}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      {formatDate(p.paidAt ?? p.createdAt)}
                    </td>
                    <td className="py-2 text-slate-500 font-mono text-xs">{p.merchantTransId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">To‘lovlar yo‘q</p>
        )}
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-1 text-lg font-bold text-slate-900 break-words">{value}</div>
    </div>
  );
}
