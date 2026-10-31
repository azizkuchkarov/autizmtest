"use client";

import React from "react";

type SoundCard = {
  id: string;
  setId: string;
  titleUz: string;
  titleRu: string;
  audioUrl: string;
  imageUrl: string | null;
  emoji: string | null;
  loud: boolean;
  order: number;
  active: boolean;
};

type SoundSet = {
  id: string;
  slug: string;
  titleUz: string;
  titleRu: string;
  descriptionUz: string | null;
  descriptionRu: string | null;
  emoji: string | null;
  imageUrl: string | null;
  order: number;
  active: boolean;
  cards: SoundCard[];
};

const inputClass = "rounded-xl border border-slate-300 px-3 py-2 text-sm w-full";
const labelClass = "block text-xs font-medium text-slate-600 mb-1";
const primaryBtn = "rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50";
const secondaryBtn = "rounded-lg bg-slate-200 hover:bg-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700";
const dangerBtn = "text-xs text-rose-600 hover:underline";

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Xatolik (${res.status})`);
  return data;
}

/** Bo'sh matnni null ga aylantiradi (ixtiyoriy maydonlar uchun). */
function nullable(s: string | null | undefined) {
  const t = (s ?? "").trim();
  return t ? t : null;
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function FormButtons({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-2 md:col-span-2">
      <button type="submit" className={primaryBtn} disabled={saving}>
        {saving ? "Saqlanmoqda..." : "Saqlash"}
      </button>
      <button type="button" className={secondaryBtn} onClick={onCancel}>
        Bekor qilish
      </button>
    </div>
  );
}

/** Saqlash tugmasi bosilganda `saving` holatini boshqaradi. */
function useDraft<T>(initial: T, onSave: (d: T) => Promise<void>) {
  const [d, setD] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const set = (patch: Partial<T>) => setD((prev) => ({ ...prev, ...patch }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(d);
    } finally {
      setSaving(false);
    }
  }
  return { d, set, saving, submit };
}

/* ------------------------------ To'plam formasi ------------------------------ */

type SetDraft = Omit<SoundSet, "id" | "cards">;

function SetForm({ initial, onSave, onCancel }: { initial: SetDraft; onSave: (d: SetDraft) => Promise<void>; onCancel: () => void }) {
  const { d, set, saving, submit } = useDraft(initial, onSave);
  return (
    <form onSubmit={submit} className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white">
      <Field label="Nomi (o'zbekcha) * — masalan: Uy hayvonlari">
        <input className={inputClass} value={d.titleUz} onChange={(e) => set({ titleUz: e.target.value })} required />
      </Field>
      <Field label="Nomi (ruscha) *">
        <input className={inputClass} value={d.titleRu} onChange={(e) => set({ titleRu: e.target.value })} required />
      </Field>
      <Field label="Tavsif (o'zbekcha)">
        <textarea className={inputClass} rows={2} value={d.descriptionUz ?? ""} onChange={(e) => set({ descriptionUz: e.target.value })} />
      </Field>
      <Field label="Tavsif (ruscha)">
        <textarea className={inputClass} rows={2} value={d.descriptionRu ?? ""} onChange={(e) => set({ descriptionRu: e.target.value })} />
      </Field>
      <Field label="Emoji (rasm bo'lmasa muqova) — masalan: 🐶">
        <input className={inputClass} value={d.emoji ?? ""} onChange={(e) => set({ emoji: e.target.value })} />
      </Field>
      <Field label="Muqova rasmi manzili">
        <input className={inputClass} value={d.imageUrl ?? ""} onChange={(e) => set({ imageUrl: e.target.value })} placeholder="https://... yoki /api/media/local/..." />
      </Field>
      <Field label="Slug * (masalan: uy-hayvonlari)">
        <input className={inputClass} value={d.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} pattern="[a-z0-9-]+" required />
      </Field>
      <Field label="Tartib raqami">
        <input type="number" className={inputClass} value={d.order} onChange={(e) => set({ order: Number(e.target.value) || 0 })} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
        <input type="checkbox" checked={d.active} onChange={(e) => set({ active: e.target.checked })} />
        Faol (ilovada ko‘rinadi)
      </label>
      <FormButtons saving={saving} onCancel={onCancel} />
    </form>
  );
}

/* ------------------------------- Ovoz formasi ------------------------------- */

type CardDraft = Omit<SoundCard, "id">;

function CardForm({ initial, onSave, onCancel }: { initial: CardDraft; onSave: (d: CardDraft) => Promise<void>; onCancel: () => void }) {
  const { d, set, saving, submit } = useDraft(initial, onSave);
  return (
    <form onSubmit={submit} className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 rounded-xl border border-slate-200">
      <Field label="Nomi (o'zbekcha) * — masalan: Kuchuk">
        <input className={inputClass} value={d.titleUz} onChange={(e) => set({ titleUz: e.target.value })} required />
      </Field>
      <Field label="Nomi (ruscha) *">
        <input className={inputClass} value={d.titleRu} onChange={(e) => set({ titleRu: e.target.value })} required />
      </Field>
      <Field label="Ovoz manzili * (MP3 / M4A)" wide>
        <input
          className={inputClass}
          value={d.audioUrl}
          onChange={(e) => set({ audioUrl: e.target.value })}
          placeholder="https://... yoki /api/media/local/sounds/dog.mp3"
          required
        />
        {d.audioUrl.trim() ? <audio key={d.audioUrl} src={d.audioUrl.trim()} controls preload="none" className="mt-2 h-9 w-full" /> : null}
      </Field>
      <Field label="Rasm manzili">
        <input className={inputClass} value={d.imageUrl ?? ""} onChange={(e) => set({ imageUrl: e.target.value })} placeholder="https://... yoki /api/media/local/..." />
      </Field>
      <Field label="Emoji (rasm bo'lmasa) — masalan: 🐶">
        <input className={inputClass} value={d.emoji ?? ""} onChange={(e) => set({ emoji: e.target.value })} />
      </Field>
      <Field label="Tartib raqami">
        <input type="number" className={inputClass} value={d.order} onChange={(e) => set({ order: Number(e.target.value) || 0 })} />
      </Field>
      <div className="flex flex-col gap-2 self-end pb-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={d.loud} onChange={(e) => set({ loud: e.target.checked })} />
          Keskin / baland tovush (sirena, momaqaldiroq…)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={d.active} onChange={(e) => set({ active: e.target.checked })} />
          Faol (ilovada ko‘rinadi)
        </label>
      </div>
      <FormButtons saving={saving} onCancel={onCancel} />
    </form>
  );
}

/* --------------------------------- Sahifa --------------------------------- */

const emptySet = (order: number): SetDraft => ({
  slug: "",
  titleUz: "",
  titleRu: "",
  descriptionUz: "",
  descriptionRu: "",
  emoji: "",
  imageUrl: "",
  order,
  active: true,
});

const emptyCard = (setId: string, order: number): CardDraft => ({
  setId,
  titleUz: "",
  titleRu: "",
  audioUrl: "",
  imageUrl: "",
  emoji: "",
  loud: false,
  order,
  active: true,
});

function setPayload(d: SetDraft) {
  return {
    slug: d.slug.trim(),
    titleUz: d.titleUz,
    titleRu: d.titleRu,
    descriptionUz: nullable(d.descriptionUz),
    descriptionRu: nullable(d.descriptionRu),
    emoji: nullable(d.emoji),
    imageUrl: nullable(d.imageUrl),
    order: d.order,
    active: d.active,
  };
}

function cardPayload(d: CardDraft) {
  return {
    setId: d.setId,
    titleUz: d.titleUz,
    titleRu: d.titleRu,
    audioUrl: d.audioUrl.trim(),
    imageUrl: nullable(d.imageUrl),
    emoji: nullable(d.emoji),
    loud: d.loud,
    order: d.order,
    active: d.active,
  };
}

/** Hozir ochiq turgan forma: yangi yoki tahrirlanayotgan to'plam/ovoz. */
type Editing = { type: "newSet" } | { type: "set"; id: string } | { type: "newCard"; setId: string } | { type: "card"; id: string } | null;

export default function AdminSounds() {
  const [sets, setSets] = React.useState<SoundSet[] | null>(null);
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [editing, setEditing] = React.useState<Editing>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const load = React.useCallback(async () => {
    setError("");
    try {
      const data = await api("/api/admin/sounds", "GET");
      setSets(data.sets ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yuklab bo'lmadi");
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    setStatus("");
    try {
      await action();
      setEditing(null);
      setStatus(success);
      await load();
    } catch (e) {
      // Formani ochiq qoldiramiz — admin xatoni tuzatishi mumkin
      alert(e instanceof Error ? e.message : "Xatolik");
    }
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function removeSet(s: SoundSet) {
    const extra = s.cards.length ? ` Ichidagi ${s.cards.length} ta ovoz ham o'chadi.` : "";
    if (!confirm(`"${s.titleUz}" to'plamini o'chirasizmi?${extra}`)) return;
    run(() => api(`/api/admin/sounds/${s.id}`, "DELETE"), "To'plam o'chirildi");
  }

  function removeCard(c: SoundCard) {
    if (!confirm(`"${c.titleUz}" ovozini o'chirasizmi?`)) return;
    run(() => api(`/api/admin/sounds/cards/${c.id}`, "DELETE"), "Ovoz o'chirildi");
  }

  return (
    <div>
      <div className="text-2xl font-bold text-slate-900">Ovozli darslar</div>
      <p className="mt-1 text-sm text-slate-600">
        “Darslar → Ovozli” bo‘limi shu yerdan boshqariladi: to‘plam (Uy hayvonlari, Transport…) → ovozlar. Ota-ona ovozni qo‘yadi, bola kimning
        ovozi ekanini topadi. 2–3-darajada variantlar shu to‘plamdagi boshqa ovozlardan olinadi, shuning uchun har to‘plamda kamida 4 ta ovoz
        bo‘lgani yaxshi. Ovoz fayllari litsenziyasi toza (CC0 yoki o‘zingiz yozib olgan) bo‘lishi kerak.
      </p>
      {status && <div className="mt-3 text-sm font-medium text-emerald-700">{status}</div>}
      {error && (
        <div className="mt-3 text-sm text-rose-600">
          {error}{" "}
          <button className="underline" onClick={load}>
            Qayta urinish
          </button>
        </div>
      )}
      {!sets && !error && <div className="mt-6 text-sm text-slate-500">Yuklanmoqda...</div>}

      {sets && (
        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-slate-900">To‘plamlar</div>
            <button className={primaryBtn} onClick={() => setEditing({ type: "newSet" })}>
              + To‘plam
            </button>
          </div>

          {editing?.type === "newSet" && (
            <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
              <SetForm
                initial={emptySet(sets.length)}
                onCancel={() => setEditing(null)}
                onSave={(d) => run(() => api("/api/admin/sounds", "POST", setPayload(d)), "To'plam qo'shildi")}
              />
            </div>
          )}

          {sets.length === 0 ? (
            <div className="mt-3 text-xs text-slate-500">Hozircha to‘plam yo‘q.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {sets.map((s) => {
                const isOpen = expanded.has(s.id);
                const isEditing = editing?.type === "set" && editing.id === s.id;
                return (
                  <div key={s.id} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between gap-3 p-3 bg-slate-50/80">
                      <button className="flex-1 text-left" onClick={() => toggle(s.id)}>
                        <span className="font-medium text-slate-900">
                          {isOpen ? "▾" : "▸"} {s.emoji ? `${s.emoji} ` : ""}
                          {s.titleUz}
                        </span>
                        <span className="ml-2 text-xs text-slate-500">
                          {s.cards.length} ta ovoz · /{s.slug}
                        </span>
                        {!s.active && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">yopiq</span>}
                        {s.cards.filter((c) => c.active).length < 4 && (
                          <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">4 tadan kam ovoz</span>
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        <button className={secondaryBtn} onClick={() => setEditing(isEditing ? null : { type: "set", id: s.id })}>
                          Tahrirlash
                        </button>
                        <button className={dangerBtn} onClick={() => removeSet(s)}>
                          O‘chirish
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <SetForm
                        initial={s}
                        onCancel={() => setEditing(null)}
                        onSave={(d) => run(() => api(`/api/admin/sounds/${s.id}`, "PATCH", setPayload(d)), "To'plam saqlandi")}
                      />
                    )}

                    {isOpen && (
                      <div className="p-3 space-y-2">
                        {s.cards.length === 0 && <div className="text-xs text-slate-500">Bu to‘plamda ovoz yo‘q.</div>}
                        {s.cards.map((c) =>
                          editing?.type === "card" && editing.id === c.id ? (
                            <CardForm
                              key={c.id}
                              initial={c}
                              onCancel={() => setEditing(null)}
                              onSave={(d) => run(() => api(`/api/admin/sounds/cards/${c.id}`, "PATCH", cardPayload(d)), "Ovoz saqlandi")}
                            />
                          ) : (
                            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-slate-900 truncate">
                                  {c.order}. {c.emoji ? `${c.emoji} ` : ""}
                                  {c.titleUz} <span className="text-slate-500">/ {c.titleRu}</span>
                                  {c.loud && <span className="ml-2 text-[11px] font-semibold text-amber-700">(baland)</span>}
                                  {!c.active && <span className="ml-2 text-[11px] text-slate-500">(yopiq)</span>}
                                </div>
                                <div className="text-xs text-slate-500 truncate">{c.audioUrl}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <audio src={c.audioUrl} controls preload="none" className="h-8 w-56" />
                                <button className={secondaryBtn} onClick={() => setEditing({ type: "card", id: c.id })}>
                                  Tahrirlash
                                </button>
                                <button className={dangerBtn} onClick={() => removeCard(c)}>
                                  O‘chirish
                                </button>
                              </div>
                            </div>
                          ),
                        )}

                        {editing?.type === "newCard" && editing.setId === s.id ? (
                          <CardForm
                            initial={emptyCard(s.id, s.cards.length + 1)}
                            onCancel={() => setEditing(null)}
                            onSave={(d) => run(() => api("/api/admin/sounds/cards", "POST", cardPayload(d)), "Ovoz qo'shildi")}
                          />
                        ) : (
                          <button className={secondaryBtn} onClick={() => setEditing({ type: "newCard", setId: s.id })}>
                            + Ovoz qo‘shish
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
