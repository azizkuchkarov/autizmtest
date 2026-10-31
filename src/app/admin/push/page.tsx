"use client";

import React from "react";

/*
 * Mobil ilova foydalanuvchilariga push xabar yuborish. Xabar faqat telefonlarga boradi (web'ga emas).
 * Har bir xabar ota-onaning telefonida ko'rinadi — kam va foydali yuboring.
 */

type Stats = { all: number; uz: number; ru: number; ios: number; android: number };
type Result = { total: number; sent: number; failed: number; removed: number; errors: string[] };

const TARGETS = [
  { value: "/", label: "Bosh sahifa" },
  { value: "/exercises", label: "Mashqlar" },
  { value: "/lessons", label: "Darslar" },
  { value: "/test", label: "Skrining testi" },
  { value: "/skills/run", label: "Ko'nikmalar testi" },
  { value: "/diary", label: "Ertalabki kundalik" },
];

const inputClass = "rounded-xl border border-slate-300 px-3 py-2 text-sm w-full";
const labelClass = "block text-xs font-medium text-slate-600 mb-1";

export default function AdminPush() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [audience, setAudience] = React.useState<"all" | "uz" | "ru">("uz");
  const [url, setUrl] = React.useState("/");
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadStats = React.useCallback(() => {
    fetch("/api/admin/push")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);
  React.useEffect(loadStats, [loadStats]);

  const count = stats ? stats[audience] : 0;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`Xabar ${count} ta qurilmaga yuboriladi. Davom etasizmi?`)) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, audience, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResult(data);
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="text-2xl font-bold text-slate-900">Push xabarlar</div>
      <p className="mt-1 text-sm text-slate-600">
        {"Mobil ilova o'rnatilgan va bildirishnomalarga ruxsat bergan ota-onalarga yuboriladi."}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(
          [
            ["Jami", stats?.all],
            ["O'zbekcha", stats?.uz],
            ["Ruscha", stats?.ru],
            ["iOS", stats?.ios],
            ["Android", stats?.android],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-xl font-bold text-slate-900">{value ?? "—"}</div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="mt-6 space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div>
          <label className={labelClass}>Kimga</label>
          <select className={inputClass} value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)}>
            <option value="uz">{"O'zbek tilidagilar"}</option>
            <option value="ru">Rus tilidagilar</option>
            <option value="all">Hammaga</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">{"Matn bitta tilda yoziladi — har bir til uchun alohida yuboring."}</p>
        </div>
        <div>
          <label className={labelClass}>Sarlavha * ({title.length}/80)</label>
          <input
            className={inputClass}
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masalan: Yangi video dars qo'shildi"
            required
          />
        </div>
        <div>
          <label className={labelClass}>Matn * ({body.length}/240)</label>
          <textarea
            className={inputClass}
            rows={3}
            value={body}
            maxLength={240}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Masalan: Bolani ismiga javob berishga o'rgatish bo'yicha 5 daqiqalik dars."
            required
          />
        </div>
        <div>
          <label className={labelClass}>Bosilganda ochiladi</label>
          <select className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)}>
            {TARGETS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {(title || body) && (
          <div>
            <div className={labelClass}>{"Telefonda shunday ko'rinadi"}</div>
            <div className="rounded-2xl bg-slate-100 p-3">
              <div className="text-xs text-slate-500">AutizmTest · hozir</div>
              <div className="text-sm font-semibold text-slate-900">{title || "Sarlavha"}</div>
              <div className="text-sm text-slate-700">{body || "Matn"}</div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={sending || count === 0}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {sending ? "Yuborilmoqda…" : `Yuborish (${count} ta qurilma)`}
        </button>
        {count === 0 && stats && <p className="text-xs text-amber-700">{"Bu guruhda hali push token yo'q."}</p>}
      </form>

      {result && (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
          Yuborildi: {result.sent} / {result.total}
          {result.removed > 0 && ` · o'chirilgan ilovalar tozalandi: ${result.removed}`}
          {result.failed > 0 && ` · xato: ${result.failed} (${result.errors.join(", ")})`}
        </div>
      )}
      {error && <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">{error}</div>}
    </div>
  );
}
