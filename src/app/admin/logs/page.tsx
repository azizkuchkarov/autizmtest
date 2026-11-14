"use client";

import React from "react";

type LogItem = {
  id: string;
  type: string;
  metadata: unknown;
  createdAt: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

function LogMetadata({ type, metadata }: { type: string; metadata: unknown }) {
  const m = asRecord(metadata);

  if (type === "test_completed" && m) {
    return (
      <div className="space-y-1 text-xs text-slate-700">
        <div>
          <span className="font-semibold text-slate-500">Assessment ID:</span>{" "}
          <span className="font-mono break-all">{String(m.assessmentId ?? "—")}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-500">Telefon:</span>{" "}
          <span className="font-mono">{String(m.phone ?? "—")}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-500">Yosh guruhi:</span> {String(m.ageGroup ?? "—")}
        </div>
        <div>
          <span className="font-semibold text-slate-500">Kim to&apos;ldiradi:</span>{" "}
          {String(m.respondent ?? "—")}
        </div>
        <div>
          <span className="font-semibold text-slate-500">Farzand jinsi:</span> {String(m.childGender ?? "—")}
        </div>
        <div>
          <span className="font-semibold text-slate-500">Test turi:</span> {String(m.testType ?? "—")}
        </div>
        <details className="mt-2">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-700">JSON</summary>
          <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-slate-100 p-2 text-[11px] leading-relaxed">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  if (type === "payment_success" && m) {
    return (
      <div className="space-y-1 text-xs text-slate-700">
        <div>
          <span className="font-semibold text-slate-500">Telefon:</span>{" "}
          <span className="font-mono">{String(m.phone ?? "—")}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-500">Summa:</span>{" "}
          {m.amount != null ? String(m.amount) : "—"} so&apos;m
        </div>
        <div>
          <span className="font-semibold text-slate-500">Payment ID:</span>{" "}
          <span className="font-mono break-all">{String(m.paymentId ?? "—")}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-500">Merchant trans:</span>{" "}
          <span className="font-mono break-all text-[11px]">{String(m.merchantTransId ?? "—")}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-500">Manba:</span> {String(m.source ?? "—")}
        </div>
        <details className="mt-2">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-700">JSON</summary>
          <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-slate-100 p-2 text-[11px] leading-relaxed">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-600">
      {metadata == null ? "—" : JSON.stringify(metadata, null, 2)}
    </pre>
  );
}

export default function AdminLogs() {
  const [items, setItems] = React.useState<LogItem[]>([]);

  React.useEffect(() => {
    fetch("/api/admin/logs")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data.items) ? data.items : []));
  }, []);

  return (
    <div>
      <div className="text-2xl font-bold text-slate-900">Loglar</div>
      <p className="mt-1 text-sm text-slate-600">
        <code className="rounded bg-slate-100 px-1">test_completed</code> — telefon va dastlabki ma&apos;lumotlar;
        <code className="ml-2 rounded bg-slate-100 px-1">payment_success</code> — to&apos;lovdagi telefon va summa.
      </p>
      <div className="mt-4 overflow-x-auto rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-4 align-top">Vaqt</th>
              <th className="py-2 pr-4 align-top">Tur</th>
              <th className="py-2 align-top">Ma&apos;lumot</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-slate-100 align-top">
                <td className="py-3 pr-4 whitespace-nowrap text-slate-600">
                  {new Date(it.createdAt).toLocaleString()}
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-slate-800">{it.type}</td>
                <td className="py-3">
                  <LogMetadata type={it.type} metadata={it.metadata} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
