"use client";

import React from "react";

type AacCard = {
  id: string;
  categoryId: string;
  titleUz: string;
  titleRu: string;
  speakUz: string | null;
  speakRu: string | null;
  emoji: string | null;
  imageUrl: string | null;
  audioUzUrl: string | null;
  audioRuUrl: string | null;
  wordType: string;
  core: boolean;
  order: number;
  active: boolean;
};

type AacCategory = {
  id: string;
  slug: string;
  titleUz: string;
  titleRu: string;
  emoji: string | null;
  order: number;
  active: boolean;
  cards: AacCard[];
};

/** Fitzgerald kaliti — ilovadagi ranglar bilan bir xil. */
const WORD_TYPES = [
  { id: "pronoun", label: "Odamlar / olmosh (sariq)", color: "#FACC15" },
  { id: "verb", label: "Harakat / fe'l (yashil)", color: "#22C55E" },
  { id: "descriptor", label: "Sifat, his-tuyg'u (ko'k)", color: "#3B82F6" },
  { id: "noun", label: "Narsa, joy / ot (to'q sariq)", color: "#F97316" },
  { id: "social", label: "Muloqot so'zlari (pushti)", color: "#EC4899" },
  { id: "question", label: "Savol (binafsha)", color: "#8B5CF6" },
  { id: "negation", label: "Inkor (qizil)", color: "#EF4444" },
  { id: "misc", label: "Boshqa (kulrang)", color: "#94A3B8" },
];

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

/* ------------------------------- Bo'lim formasi ------------------------------- */

type CategoryDraft = Omit<AacCategory, "id" | "cards">;

function CategoryForm({ initial, onSave, onCancel }: { initial: CategoryDraft; onSave: (d: CategoryDraft) => Promise<void>; onCancel: () => void }) {
  const { d, set, saving, submit } = useDraft(initial, onSave);
  return (
    <form onSubmit={submit} className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white">
      <Field label="Nomi (o'zbekcha) * — masalan: Ovqat">
        <input className={inputClass} value={d.titleUz} onChange={(e) => set({ titleUz: e.target.value })} required />
      </Field>
      <Field label="Nomi (ruscha) *">
        <input className={inputClass} value={d.titleRu} onChange={(e) => set({ titleRu: e.target.value })} required />
      </Field>
      <Field label="Emoji — masalan: 🍎">
        <input className={inputClass} value={d.emoji ?? ""} onChange={(e) => set({ emoji: e.target.value })} />
      </Field>
      <Field label="Slug * (masalan: ovqat)">
        <input className={inputClass} value={d.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} pattern="[a-z0-9-]+" required />
      </Field>
      <Field label="Tartib raqami">
        <input type="number" className={inputClass} value={d.order} onChange={(e) => set({ order: Number(e.target.value) || 0 })} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-700 self-end pb-2">
        <input type="checkbox" checked={d.active} onChange={(e) => set({ active: e.target.checked })} />
        Faol (ilovada ko‘rinadi)
      </label>
      <FormButtons saving={saving} onCancel={onCancel} />
    </form>
  );
}

/* ------------------------------- Karta formasi ------------------------------- */

type CardDraft = Omit<AacCard, "id">;

function CardForm({ initial, onSave, onCancel }: { initial: CardDraft; onSave: (d: CardDraft) => Promise<void>; onCancel: () => void }) {
  const { d, set, saving, submit } = useDraft(initial, onSave);
  return (
    <form onSubmit={submit} className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 rounded-xl border border-slate-200">
      <Field label="So'z (o'zbekcha) * — kartada yoziladi">
        <input className={inputClass} value={d.titleUz} onChange={(e) => set({ titleUz: e.target.value })} required />
      </Field>
      <Field label="So'z (ruscha) *">
        <input className={inputClass} value={d.titleRu} onChange={(e) => set({ titleRu: e.target.value })} required />
      </Field>
      <Field label="Aytiladigan gap (o'zbekcha) — bo'sh bo'lsa so'zning o'zi">
        <input className={inputClass} value={d.speakUz ?? ""} onChange={(e) => set({ speakUz: e.target.value })} placeholder="Hojatxonaga boraman" />
      </Field>
      <Field label="Aytiladigan gap (ruscha)">
        <input className={inputClass} value={d.speakRu ?? ""} onChange={(e) => set({ speakRu: e.target.value })} placeholder="Хочу в туалет" />
      </Field>
      <Field label="Emoji (rasm bo'lmasa) — masalan: 🍎">
        <input className={inputClass} value={d.emoji ?? ""} onChange={(e) => set({ emoji: e.target.value })} />
      </Field>
      <Field label="Rasm manzili">
        <input className={inputClass} value={d.imageUrl ?? ""} onChange={(e) => set({ imageUrl: e.target.value })} placeholder="https://... yoki /api/media/local/..." />
      </Field>
      <Field label="O'zbekcha ovoz (MP3) — qurilmada o'zbek ovozi bo'lmagani uchun tavsiya etiladi">
        <input className={inputClass} value={d.audioUzUrl ?? ""} onChange={(e) => set({ audioUzUrl: e.target.value })} placeholder="/api/media/local/aac/uz/aac-water.mp3" />
        {d.audioUzUrl?.trim() ? <audio key={d.audioUzUrl} src={d.audioUzUrl.trim()} controls preload="none" className="mt-2 h-9 w-full" /> : null}
      </Field>
      <Field label="Ruscha ovoz (MP3) — bo'sh bo'lsa qurilma o'qib beradi">
        <input className={inputClass} value={d.audioRuUrl ?? ""} onChange={(e) => set({ audioRuUrl: e.target.value })} />
        {d.audioRuUrl?.trim() ? <audio key={d.audioRuUrl} src={d.audioRuUrl.trim()} controls preload="none" className="mt-2 h-9 w-full" /> : null}
      </Field>
      <Field label="So'z turi (karta rangi)">
        <select className={inputClass} value={d.wordType} onChange={(e) => set({ wordType: e.target.value })}>
          {WORD_TYPES.map((w) => (
            <option key={w.id} value={w.id}>
              {w.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Tartib raqami">
        <input type="number" className={inputClass} value={d.order} onChange={(e) => set({ order: Number(e.target.value) || 0 })} />
      </Field>
      <div className="flex flex-col gap-2 md:col-span-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={d.core} onChange={(e) => set({ core: e.target.checked })} />
          Asosiy so‘z (doim ko‘rinadigan yuqori qatorda)
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

const emptyCategory = (order: number): CategoryDraft => ({ slug: "", titleUz: "", titleRu: "", emoji: "", order, active: true });

const emptyCard = (categoryId: string, order: number): CardDraft => ({
  categoryId,
  titleUz: "",
  titleRu: "",
  speakUz: "",
  speakRu: "",
  emoji: "",
  imageUrl: "",
  audioUzUrl: "",
  audioRuUrl: "",
  wordType: "noun",
  core: false,
  order,
  active: true,
});

function categoryPayload(d: CategoryDraft) {
  return { slug: d.slug.trim(), titleUz: d.titleUz, titleRu: d.titleRu, emoji: nullable(d.emoji), order: d.order, active: d.active };
}

function cardPayload(d: CardDraft) {
  return {
    categoryId: d.categoryId,
    titleUz: d.titleUz,
    titleRu: d.titleRu,
    speakUz: nullable(d.speakUz),
    speakRu: nullable(d.speakRu),
    emoji: nullable(d.emoji),
    imageUrl: nullable(d.imageUrl),
    audioUzUrl: nullable(d.audioUzUrl),
    audioRuUrl: nullable(d.audioRuUrl),
    wordType: d.wordType,
    core: d.core,
    order: d.order,
    active: d.active,
  };
}

const typeColor = (id: string) => WORD_TYPES.find((w) => w.id === id)?.color ?? "#94A3B8";

/** Hozir ochiq turgan forma: yangi yoki tahrirlanayotgan bo'lim/karta. */
type Editing = { type: "newCategory" } | { type: "category"; id: string } | { type: "newCard"; categoryId: string } | { type: "card"; id: string } | null;

export default function AdminAac() {
  const [categories, setCategories] = React.useState<AacCategory[] | null>(null);
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [editing, setEditing] = React.useState<Editing>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const load = React.useCallback(async () => {
    setError("");
    try {
      const data = await api("/api/admin/aac", "GET");
      setCategories(data.categories ?? []);
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

  function removeCategory(c: AacCategory) {
    const extra = c.cards.length ? ` Ichidagi ${c.cards.length} ta karta ham o'chadi.` : "";
    if (!confirm(`"${c.titleUz}" bo'limini o'chirasizmi?${extra}`)) return;
    run(() => api(`/api/admin/aac/${c.id}`, "DELETE"), "Bo'lim o'chirildi");
  }

  function removeCard(c: AacCard) {
    if (!confirm(`"${c.titleUz}" kartasini o'chirasizmi?`)) return;
    run(() => api(`/api/admin/aac/cards/${c.id}`, "DELETE"), "Karta o'chirildi");
  }

  const total = categories?.reduce((n, c) => n + c.cards.length, 0) ?? 0;
  const withUzAudio = categories?.reduce((n, c) => n + c.cards.filter((x) => x.audioUzUrl).length, 0) ?? 0;

  return (
    <div>
      <div className="text-2xl font-bold text-slate-900">Rasmli muloqot</div>
      <p className="mt-1 text-sm text-slate-600">
        Gapirmaydigan yoki kam gapiradigan bolalar uchun muloqot kartalari (AAC / PECS). Bola kartani bosadi — ilova so‘zni ovoz chiqarib aytadi. Karta
        rangi so‘z turiga qarab (Fitzgerald kaliti) belgilanadi. Qurilmalarda o‘zbek tilidagi sintez ovoz deyarli yo‘q, shuning uchun o‘zbekcha ovoz faylini
        kiritish tavsiya etiladi; ota-onalar ilovada o‘z ovozini ham yozib olishlari mumkin.
      </p>
      {categories && (
        <div className="mt-2 text-xs text-slate-500">
          Jami {total} ta karta · o‘zbekcha ovozi bor: {withUzAudio}
        </div>
      )}
      {status && <div className="mt-3 text-sm font-medium text-emerald-700">{status}</div>}
      {error && (
        <div className="mt-3 text-sm text-rose-600">
          {error}{" "}
          <button className="underline" onClick={load}>
            Qayta urinish
          </button>
        </div>
      )}
      {!categories && !error && <div className="mt-6 text-sm text-slate-500">Yuklanmoqda...</div>}

      {categories && (
        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-slate-900">Bo‘limlar</div>
            <button className={primaryBtn} onClick={() => setEditing({ type: "newCategory" })}>
              + Bo‘lim
            </button>
          </div>

          {editing?.type === "newCategory" && (
            <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
              <CategoryForm
                initial={emptyCategory(categories.length)}
                onCancel={() => setEditing(null)}
                onSave={(d) => run(() => api("/api/admin/aac", "POST", categoryPayload(d)), "Bo'lim qo'shildi")}
              />
            </div>
          )}

          <div className="mt-3 space-y-2">
            {categories.map((c) => {
              const isOpen = expanded.has(c.id);
              const isEditing = editing?.type === "category" && editing.id === c.id;
              return (
                <div key={c.id} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between gap-3 p-3 bg-slate-50/80">
                    <button className="flex-1 text-left" onClick={() => toggle(c.id)}>
                      <span className="font-medium text-slate-900">
                        {isOpen ? "▾" : "▸"} {c.emoji ? `${c.emoji} ` : ""}
                        {c.titleUz}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        {c.cards.length} ta karta · /{c.slug}
                      </span>
                      {!c.active && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">yopiq</span>}
                    </button>
                    <div className="flex items-center gap-2">
                      <button className={secondaryBtn} onClick={() => setEditing(isEditing ? null : { type: "category", id: c.id })}>
                        Tahrirlash
                      </button>
                      <button className={dangerBtn} onClick={() => removeCategory(c)}>
                        O‘chirish
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <CategoryForm
                      initial={c}
                      onCancel={() => setEditing(null)}
                      onSave={(d) => run(() => api(`/api/admin/aac/${c.id}`, "PATCH", categoryPayload(d)), "Bo'lim saqlandi")}
                    />
                  )}

                  {isOpen && (
                    <div className="p-3 space-y-2">
                      {c.cards.length === 0 && <div className="text-xs text-slate-500">Bu bo‘limda karta yo‘q.</div>}
                      {c.cards.map((card) =>
                        editing?.type === "card" && editing.id === card.id ? (
                          <CardForm
                            key={card.id}
                            initial={card}
                            onCancel={() => setEditing(null)}
                            onSave={(d) => run(() => api(`/api/admin/aac/cards/${card.id}`, "PATCH", cardPayload(d)), "Karta saqlandi")}
                          />
                        ) : (
                          <div
                            key={card.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 border-l-4 px-3 py-2"
                            style={{ borderLeftColor: typeColor(card.wordType) }}
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-900 truncate">
                                {card.emoji ? `${card.emoji} ` : ""}
                                {card.titleUz} <span className="text-slate-500">/ {card.titleRu}</span>
                                {card.core && <span className="ml-2 text-[11px] font-semibold text-indigo-700">(asosiy)</span>}
                                {!card.active && <span className="ml-2 text-[11px] text-slate-500">(yopiq)</span>}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {card.speakUz ? `“${card.speakUz}” · ` : ""}
                                {card.audioUzUrl ? "o‘zbekcha ovoz ✓" : "o‘zbekcha ovoz yo‘q"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button className={secondaryBtn} onClick={() => setEditing({ type: "card", id: card.id })}>
                                Tahrirlash
                              </button>
                              <button className={dangerBtn} onClick={() => removeCard(card)}>
                                O‘chirish
                              </button>
                            </div>
                          </div>
                        ),
                      )}

                      {editing?.type === "newCard" && editing.categoryId === c.id ? (
                        <CardForm
                          initial={emptyCard(c.id, c.cards.length)}
                          onCancel={() => setEditing(null)}
                          onSave={(d) => run(() => api("/api/admin/aac/cards", "POST", cardPayload(d)), "Karta qo'shildi")}
                        />
                      ) : (
                        <button className={secondaryBtn} onClick={() => setEditing({ type: "newCard", categoryId: c.id })}>
                          + Karta qo‘shish
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
