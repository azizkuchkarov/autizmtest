"use client";

import React from "react";

type Settings = {
  enabled: boolean;
  inApp: boolean;
  amount: number;
  periodDays: number;
  minVersion: string | null;
  hideVersions: string[];
};

type Overview = {
  settings: Settings;
  source: "admin" | "env";
  updatedAt: string | null;
  updatedBy: string | null;
  clickConfigured: boolean;
  stats: { activeSubscribers: number; paidLast30Days: number; revenueLast30Days: number };
  payments: { id: string; phone: string; amount: number; days: number; status: string; source: "admin" | "click"; createdAt: string; paidAt: string | null }[];
  active: { id: string; phone: string; paidUntil: string }[];
};

const sum = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so'm`;
const date = (iso: string) => new Date(iso).toLocaleDateString("ru-RU");
const dateTime = (iso: string) => new Date(iso).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
    </label>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

export default function AdminPayments() {
  const [data, setData] = React.useState<Overview | null>(null);
  const [form, setForm] = React.useState<(Omit<Settings, "hideVersions" | "minVersion"> & { minVersion: string; hideVersions: string }) | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [grantPhone, setGrantPhone] = React.useState("");
  const [grantDays, setGrantDays] = React.useState(30);
  const [accessMessage, setAccessMessage] = React.useState<{ ok: boolean; text: string } | null>(null);

  const load = React.useCallback(async () => {
    const r = await fetch("/api/admin/payments", { cache: "no-store" });
    if (!r.ok) return;
    const d = (await r.json()) as Overview;
    setData(d);
    setForm({ ...d.settings, minVersion: d.settings.minVersion ?? "", hideVersions: d.settings.hideVersions.join(", ") });
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setMessage(null);
    const body: Settings = {
      enabled: form.enabled,
      inApp: form.inApp,
      amount: Number(form.amount),
      periodDays: Number(form.periodDays),
      minVersion: form.minVersion.trim() || null,
      hideVersions: form.hideVersions
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    };
    const r = await fetch("/api/admin/payments/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => null);
    setSaving(false);
    if (!r.ok) return setMessage({ ok: false, text: d?.error ?? "Saqlanmadi." });
    setMessage({ ok: true, text: "Saqlandi. Bir necha soniyada hamma joyda kuchga kiradi." });
    void load();
  };

  const resetToEnv = async () => {
    if (!confirm("Admin sozlamalari o'chiriladi va serverdagi .env qiymatlari ishlatiladi. Davom etasizmi?")) return;
    await fetch("/api/admin/payments/settings", { method: "DELETE" });
    setMessage({ ok: true, text: ".env qiymatlariga qaytarildi." });
    void load();
  };

  const access = async (action: "grant" | "revoke", phone: string) => {
    setAccessMessage(null);
    if (action === "revoke" && !confirm(`${phone} — Darslarga kirish olib qo'yilsinmi?`)) return;
    const r = await fetch("/api/admin/payments/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "grant" ? { action, phone, days: Number(grantDays) } : { action, phone }),
    });
    const d = await r.json().catch(() => null);
    if (!r.ok) return setAccessMessage({ ok: false, text: d?.error ?? "Xatolik." });
    setAccessMessage({ ok: true, text: action === "grant" ? `${phone}: ${date(d.paidUntil)} gacha ochildi.` : `${phone}: kirish olib qo'yildi.` });
    if (action === "grant") setGrantPhone("");
    void load();
  };

  if (!data || !form) return <div className="text-sm text-slate-500">Yuklanmoqda…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-2xl font-bold text-slate-900">To&apos;lov</div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${data.settings.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
          {data.settings.enabled ? "Yoqilgan" : "O'chiq — darslar bepul"}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${data.clickConfigured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {data.clickConfigured ? "Click kalitlari sozlangan" : "Click kalitlari sozlanmagan"}
        </span>
      </div>
      <p className="-mt-3 text-sm text-slate-600">
        Skrining testlari va mashqlar har doim bepul. To&apos;lov faqat Darslar bo&apos;limidagi video darslar uchun (oylik kirish).
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Faol obunachilar", String(data.stats.activeSubscribers)],
          ["30 kunda to'lovlar", String(data.stats.paidLast30Days)],
          ["30 kunda tushum", sum(data.stats.revenueLast30Days)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="text-xs font-semibold text-slate-500">{k}</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{v}</div>
          </div>
        ))}
      </div>

      <section className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-lg font-bold text-slate-900">Sozlamalar</div>
          <div className="text-xs text-slate-500">
            {data.source === "admin"
              ? `Admin paneldan saqlangan${data.updatedAt ? ` · ${dateTime(data.updatedAt)}` : ""}${data.updatedBy ? ` · ${data.updatedBy}` : ""}`
              : "Hozir serverdagi .env qiymatlari ishlatilmoqda"}
          </div>
        </div>

        <Toggle
          checked={form.enabled}
          onChange={(v) => setForm({ ...form, enabled: v })}
          label="To'lovni yoqish"
          hint="O'chiq bo'lsa video darslar hammaga bepul ochiq. Yoqilsa — saytda narx va Click tugmasi, ilovada qulf."
        />
        {form.enabled && !data.clickConfigured ? (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
            Click kalitlari serverdagi .env da yo&apos;q: darslar qulflanadi, lekin to&apos;lov qilib bo&apos;lmaydi. Avval CLICK_* kalitlarini qo&apos;shing.
          </div>
        ) : null}

        <Toggle
          checked={form.inApp}
          onChange={(v) => setForm({ ...form, inApp: v })}
          label="Ilova ichida Click tugmasi"
          hint="Odatda o'chiq qoldiring: ilovada darslar qulf bilan ko'rinadi, to'lov faqat saytda. Yoqilsa App Store / Google Play review'dan o'tmasligi mumkin."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Oylik narx (so'm)">
            <input type="number" min={100} className={input} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </Field>
          <Field label="Bitta to'lov necha kun beradi">
            <input type="number" min={1} className={input} value={form.periodDays} onChange={(e) => setForm({ ...form, periodDays: Number(e.target.value) })} />
          </Field>
          <Field label="Minimal ilova versiyasi" hint="Shu versiyadan past ilovalarda to'lov ko'rinmaydi (darslar bepul). Bo'sh — cheklov yo'q.">
            <input className={input} placeholder="masalan: 1.1.0" value={form.minVersion} onChange={(e) => setForm({ ...form, minVersion: e.target.value })} />
          </Field>
          <Field label="Yashiriladigan ilova versiyalari" hint="Vergul bilan. Bu versiyalarda to'lov ko'rinmaydi.">
            <input className={input} placeholder="masalan: 1.2.0, 1.2.1" value={form.hideVersions} onChange={(e) => setForm({ ...form, hideVersions: e.target.value })} />
          </Field>
        </div>
        <p className="text-xs text-slate-500">Hozirgi do&apos;kondagi ilovalar (1.0.0) versiyasini yubormaydi — ularda darslar har doim bepul ochiq qoladi.</p>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={save} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Saqlanmoqda…" : "Saqlash"}
          </button>
          {data.source === "admin" ? (
            <button onClick={resetToEnv} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              .env qiymatlariga qaytarish
            </button>
          ) : null}
          {message ? <span className={`text-sm ${message.ok ? "text-emerald-700" : "text-rose-700"}`}>{message.text}</span> : null}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div>
          <div className="text-lg font-bold text-slate-900">Qo&apos;lda kirish berish</div>
          <div className="text-xs text-slate-500">Masalan, App Store / Google Play tekshiruvchisining demo akkauntiga yoki bepul berilishi kerak bo&apos;lgan oilaga.</div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <Field label="Telefon raqami">
              <input className={input} placeholder="+998 90 123 45 67" value={grantPhone} onChange={(e) => setGrantPhone(e.target.value)} />
            </Field>
          </div>
          <div className="w-32">
            <Field label="Necha kun">
              <input type="number" min={1} className={input} value={grantDays} onChange={(e) => setGrantDays(Number(e.target.value))} />
            </Field>
          </div>
          <button
            onClick={() => access("grant", grantPhone)}
            disabled={!grantPhone.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Kirish berish
          </button>
        </div>
        {accessMessage ? <div className={`text-sm ${accessMessage.ok ? "text-emerald-700" : "text-rose-700"}`}>{accessMessage.text}</div> : null}
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="text-lg font-bold text-slate-900">Faol obunachilar ({data.stats.activeSubscribers})</div>
        {data.active.length === 0 ? (
          <div className="mt-3 text-sm text-slate-500">Hozircha yo&apos;q.</div>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-2">Telefon</th>
                <th>Qachongacha</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.active.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="py-2 font-mono">{u.phone}</td>
                  <td>{date(u.paidUntil)}</td>
                  <td className="text-right">
                    <button onClick={() => access("revoke", u.phone)} className="text-xs font-semibold text-rose-600 hover:underline">
                      Olib qo&apos;yish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="text-lg font-bold text-slate-900">So&apos;nggi to&apos;lovlar</div>
        {data.payments.length === 0 ? (
          <div className="mt-3 text-sm text-slate-500">Hozircha yo&apos;q.</div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-2">Sana</th>
                  <th>Telefon</th>
                  <th>Summa</th>
                  <th>Kun</th>
                  <th>Holat</th>
                  <th>Manba</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="py-2 whitespace-nowrap">{dateTime(p.paidAt ?? p.createdAt)}</td>
                    <td className="font-mono">{p.phone}</td>
                    <td>{p.amount > 0 ? sum(p.amount) : "—"}</td>
                    <td>{p.days}</td>
                    <td>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          p.status === "paid" ? "bg-emerald-100 text-emerald-800" : p.status === "failed" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.status === "paid" ? "To'langan" : p.status === "failed" ? "Bekor" : "Kutilmoqda"}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">{p.source === "admin" ? "Admin" : "Click"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
