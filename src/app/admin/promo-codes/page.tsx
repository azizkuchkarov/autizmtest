"use client";

import React from "react";

type PromoRow = {
  id: string;
  code: string;
  assessmentId: string;
  expiresAt: string | null;
  maxUses: number;
  usedCount: number;
  active: boolean;
  note: string | null;
  createdAt: string;
  assessmentAgeGroup?: string | null;
  assessmentCreatedAt?: string;
};

export default function AdminPromoCodesPage() {
  const [items, setItems] = React.useState<PromoRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [assessmentId, setAssessmentId] = React.useState("");
  const [note, setNote] = React.useState("");
  const [maxUses, setMaxUses] = React.useState(1);
  const [expiresAt, setExpiresAt] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const [lastCreated, setLastCreated] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/promo-codes");
      const data = await r.json();
      if (!r.ok) throw new Error(typeof data?.error === "string" ? data.error : "Error");
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setLastCreated(null);
    const aid = assessmentId.trim();
    if (!aid) {
      setFormError("Assessment ID kerak.");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        assessmentId: aid,
        maxUses,
      };
      const n = note.trim();
      if (n) body.note = n;
      if (expiresAt) {
        body.expiresAt = new Date(expiresAt).toISOString();
      }
      const r = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) {
        setFormError(typeof data?.error === "string" ? data.error : "Xatolik");
        return;
      }
      setLastCreated(typeof data.promo?.code === "string" ? data.promo.code : null);
      setAssessmentId("");
      setNote("");
      setExpiresAt("");
      setMaxUses(1);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <div className="text-2xl font-bold text-slate-900">Promo-kodlar (demo)</div>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Har bir kod faqat ko‘rsatilgan assessment ID uchun ishlaydi. Foydalanuvchi to‘lov sahifasida kodni kiritadi va
        natijaga o‘tadi.
      </p>

      <form onSubmit={handleCreate} className="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Assessment ID *</label>
          <input
            type="text"
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
            placeholder="uuid"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Izoh (ixtiyoriy)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            maxLength={500}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Max foydalanish</label>
            <input
              type="number"
              min={1}
              max={100}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value) || 1)}
              className="mt-1 w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Muddati (ixtiyoriy)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        {formError && <p className="text-sm font-semibold text-rose-600">{formError}</p>}
        {lastCreated && (
          <p className="text-sm font-semibold text-emerald-700">
            Yaratildi:{" "}
            <span className="font-mono">
              {lastCreated}
            </span>{" "}
            <button
              type="button"
              onClick={() => void copyCode(lastCreated)}
              className="ml-2 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-800 hover:bg-slate-200"
            >
              Nusxa
            </button>
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Yaratilmoqda…" : "Kod yaratish"}
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">So‘nggi kodlar</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Yuklanmoqda…</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Hozircha kod yo‘q.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((it) => (
              <li key={it.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">{it.code}</span>
                  <button
                    type="button"
                    onClick={() => void copyCode(it.code)}
                    className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-800 hover:bg-slate-200"
                  >
                    Nusxa
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Assessment: <span className="font-mono text-slate-700">{it.assessmentId}</span>
                  {it.assessmentAgeGroup != null && (
                    <span className="ml-2">• {it.assessmentAgeGroup}</span>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {it.usedCount}/{it.maxUses} ishlatilgan • {it.active ? "faol" : "o‘chirilgan"} •{" "}
                  {new Date(it.createdAt).toLocaleString()}
                  {it.expiresAt && ` • muddati ${new Date(it.expiresAt).toLocaleString()}`}
                </div>
                {it.note && <div className="mt-2 text-sm text-slate-700">{it.note}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
