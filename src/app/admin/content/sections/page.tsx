"use client";

import React from "react";

type Kind = "lesson" | "exercise";

type Video = {
  id: string;
  categoryId: string;
  titleUz: string;
  titleRu: string;
  descriptionUz: string | null;
  descriptionRu: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  ageGroups: string[];
  domains: string[];
  order: number;
  active: boolean;
};

type Profession = {
  id: string;
  slug: string;
  titleUz: string;
  titleRu: string;
  order: number;
  active: boolean;
};

type Category = {
  id: string;
  slug: string;
  kind: Kind;
  professionId: string;
  titleUz: string;
  titleRu: string;
  descriptionUz: string | null;
  descriptionRu: string | null;
  order: number;
  active: boolean;
  videos: Video[];
};

const KIND_LABELS: Record<Kind, string> = {
  lesson: "Darslar (autizm haqida)",
  exercise: "Uyda mashqlar",
};

const AGE_GROUPS = [
  { id: "AGE_1_5_2", label: "1,5–2 yosh" },
  { id: "AGE_3_4", label: "3–4 yosh" },
  { id: "AGE_5_6", label: "5–6 yosh" },
  { id: "AGE_7_9", label: "7–9 yosh" },
];

const DOMAINS = [
  { id: "A", label: "A — Ijtimoiy aloqa" },
  { id: "B", label: "B — Muloqot va til" },
  { id: "C", label: "C — Takroriy xatti-harakatlar" },
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

function Hint({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return <p className={`mt-1 text-xs ${warn ? "text-amber-700" : "text-slate-500"}`}>{children}</p>;
}

/** "1-mashq", "3-blok", "Nutq — 1-dars" kabi nomlar ota-onaga video nima haqida ekanini aytmaydi. */
function isGenericTitle(title: string) {
  const t = title.trim().toLowerCase();
  return /^[\p{L}\s]*[—–-]?\s*\d+\s*[-–]?\s*(mashq|blok|dars|qism|video|урок|упражнение|часть|блок)$/u.test(t) || /^\d+$/.test(t);
}

/** Ota-onaga ko'rinadigan muammolar: tushunarsiz nom, tavsif yoki muqova yo'qligi. */
function videoIssues(v: { titleUz: string; descriptionUz: string | null; thumbnailUrl: string | null }) {
  const issues: string[] = [];
  if (isGenericTitle(v.titleUz)) issues.push("nom tushunarsiz");
  if (!v.descriptionUz?.trim()) issues.push("tavsif yo'q");
  if (!v.thumbnailUrl) issues.push("muqova yo'q");
  return issues;
}

function CheckboxGroup({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((o) => (
        <label key={o.id} className="flex items-center gap-1.5 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value.includes(o.id)}
            onChange={(e) => onChange(e.target.checked ? [...value, o.id] : value.filter((x) => x !== o.id))}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

/* ----------------------------- Yo'nalish formasi ----------------------------- */

type ProfessionDraft = Omit<Profession, "id">;

function ProfessionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: ProfessionDraft;
  onSave: (d: ProfessionDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [d, setD] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const set = (patch: Partial<ProfessionDraft>) => setD((prev) => ({ ...prev, ...patch }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(d);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 p-3 grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white">
      <Field label="Nomi (o'zbekcha) * — masalan: Logoped">
        <input className={inputClass} value={d.titleUz} onChange={(e) => set({ titleUz: e.target.value })} required />
      </Field>
      <Field label="Nomi (ruscha) *">
        <input className={inputClass} value={d.titleRu} onChange={(e) => set({ titleRu: e.target.value })} required />
      </Field>
      <Field label="Slug * (masalan: speech)">
        <input
          className={inputClass}
          value={d.slug}
          onChange={(e) => set({ slug: e.target.value.toLowerCase() })}
          pattern="[a-z0-9-]+"
          required
        />
      </Field>
      <Field label="Tartib raqami">
        <input type="number" className={inputClass} value={d.order} onChange={(e) => set({ order: Number(e.target.value) || 0 })} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
        <input type="checkbox" checked={d.active} onChange={(e) => set({ active: e.target.checked })} />
        Faol (ilovada ko‘rinadi)
      </label>
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" className={primaryBtn} disabled={saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
        <button type="button" className={secondaryBtn} onClick={onCancel}>
          Bekor qilish
        </button>
      </div>
    </form>
  );
}

/* ------------------------------- Mavzu formasi ------------------------------- */

type CategoryDraft = Omit<Category, "id" | "videos">;

function CategoryForm({
  initial,
  professions,
  onSave,
  onCancel,
}: {
  initial: CategoryDraft;
  professions: Profession[];
  onSave: (d: CategoryDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [d, setD] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const set = (patch: Partial<CategoryDraft>) => setD((prev) => ({ ...prev, ...patch }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(d);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white">
      <Field label="Sarlavha (o'zbekcha) *">
        <input className={inputClass} value={d.titleUz} onChange={(e) => set({ titleUz: e.target.value })} required />
      </Field>
      <Field label="Sarlavha (ruscha) *">
        <input className={inputClass} value={d.titleRu} onChange={(e) => set({ titleRu: e.target.value })} required />
      </Field>
      <Field label="Tavsif (o'zbekcha)">
        <textarea className={inputClass} rows={2} value={d.descriptionUz ?? ""} onChange={(e) => set({ descriptionUz: e.target.value })} />
      </Field>
      <Field label="Tavsif (ruscha)">
        <textarea className={inputClass} rows={2} value={d.descriptionRu ?? ""} onChange={(e) => set({ descriptionRu: e.target.value })} />
      </Field>
      <Field label="Yo'nalish *">
        <select className={inputClass} value={d.professionId} onChange={(e) => set({ professionId: e.target.value })} required>
          <option value="" disabled>
            Tanlang
          </option>
          {professions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.titleUz}
              {p.active ? "" : " (yopiq)"}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Tur">
        <select className={inputClass} value={d.kind} onChange={(e) => set({ kind: e.target.value as Kind })}>
          {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Slug * (lotin harflari, raqam va -, masalan: autizm-nima)">
        <input
          className={inputClass}
          value={d.slug}
          onChange={(e) => set({ slug: e.target.value.toLowerCase() })}
          pattern="[a-z0-9-]+"
          required
        />
      </Field>
      <Field label="Tartib raqami">
        <input type="number" className={inputClass} value={d.order} onChange={(e) => set({ order: Number(e.target.value) || 0 })} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
        <input type="checkbox" checked={d.active} onChange={(e) => set({ active: e.target.checked })} />
        Faol (ilovada ko‘rinadi)
      </label>
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" className={primaryBtn} disabled={saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
        <button type="button" className={secondaryBtn} onClick={onCancel}>
          Bekor qilish
        </button>
      </div>
    </form>
  );
}

/* ------------------------------- Video formasi ------------------------------- */

type VideoDraft = Omit<Video, "id">;

function VideoForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: VideoDraft;
  onSave: (d: VideoDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [d, setD] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const set = (patch: Partial<VideoDraft>) => setD((prev) => ({ ...prev, ...patch }));
  const minutes = d.durationSec ? Math.round((d.durationSec / 60) * 10) / 10 : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(d);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 rounded-xl border border-slate-200">
      <Field label="Sarlavha (o'zbekcha) *">
        <input
          className={inputClass}
          value={d.titleUz}
          onChange={(e) => set({ titleUz: e.target.value })}
          placeholder="Masalan: Bolani ismiga javob berishga o'rgatish"
          required
        />
        {isGenericTitle(d.titleUz) ? (
          <Hint warn>{"«1-mashq», «2-blok» kabi nom ota-onaga video nima haqida ekanini aytmaydi. Nimani o'rgatishini yozing."}</Hint>
        ) : (
          <Hint>{"Ota-ona nomdan video nimani o'rgatishini tushunishi kerak."}</Hint>
        )}
      </Field>
      <Field label="Sarlavha (ruscha) *">
        <input className={inputClass} value={d.titleRu} onChange={(e) => set({ titleRu: e.target.value })} required />
      </Field>
      <Field label="Tavsif (o'zbekcha)">
        <textarea
          className={inputClass}
          rows={3}
          value={d.descriptionUz ?? ""}
          onChange={(e) => set({ descriptionUz: e.target.value })}
          placeholder="Masalan: Bola ismini eshitganda qarashini o'rgatadigan 3 ta oddiy o'yin. Kuniga 5 daqiqa."
        />
        <Hint>{"1–2 jumla: bu videodan ota-ona nimani o'rganadi va uyda nima qiladi."}</Hint>
      </Field>
      <Field label="Tavsif (ruscha)">
        <textarea className={inputClass} rows={3} value={d.descriptionRu ?? ""} onChange={(e) => set({ descriptionRu: e.target.value })} />
      </Field>
      <Field label="Video manzili * (MP4 yoki HLS .m3u8 havola)" wide>
        <input
          className={inputClass}
          value={d.videoUrl}
          onChange={(e) => set({ videoUrl: e.target.value })}
          placeholder="https://... yoki /api/media/local/fayl.mp4"
          required
        />
      </Field>
      <Field label="Muqova rasmi manzili">
        <input
          className={inputClass}
          value={d.thumbnailUrl ?? ""}
          onChange={(e) => set({ thumbnailUrl: e.target.value })}
          placeholder="https://... yoki /uploads/..."
        />
      </Field>
      <Field label="Davomiyligi (daqiqa)">
        <input
          type="number"
          min={0}
          step={0.5}
          className={inputClass}
          value={minutes}
          onChange={(e) => {
            const m = Number(e.target.value);
            set({ durationSec: m > 0 ? Math.round(m * 60) : null });
          }}
        />
      </Field>
      <Field label="Yosh guruhlari (hech biri tanlanmasa — barcha yoshlar)" wide>
        <CheckboxGroup options={AGE_GROUPS} value={d.ageGroups} onChange={(ageGroups) => set({ ageGroups })} />
      </Field>
      <Field label="Skrining sohalari (natijada shu sohalar zaif chiqsa, video tavsiya qilinadi)" wide>
        <CheckboxGroup options={DOMAINS} value={d.domains} onChange={(domains) => set({ domains })} />
      </Field>
      <Field label="Tartib raqami">
        <input type="number" className={inputClass} value={d.order} onChange={(e) => set({ order: Number(e.target.value) || 0 })} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-700 self-end pb-2">
        <input type="checkbox" checked={d.active} onChange={(e) => set({ active: e.target.checked })} />
        Faol (ilovada ko‘rinadi)
      </label>
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" className={primaryBtn} disabled={saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
        <button type="button" className={secondaryBtn} onClick={onCancel}>
          Bekor qilish
        </button>
      </div>
    </form>
  );
}

/* --------------------------------- Sahifa --------------------------------- */

const emptyProfession = (order: number): ProfessionDraft => ({ slug: "", titleUz: "", titleRu: "", order, active: true });

const emptyCategory = (kind: Kind, professionId: string, order: number): CategoryDraft => ({
  slug: "",
  kind,
  professionId,
  titleUz: "",
  titleRu: "",
  descriptionUz: "",
  descriptionRu: "",
  order,
  active: true,
});

const emptyVideo = (categoryId: string, order: number): VideoDraft => ({
  categoryId,
  titleUz: "",
  titleRu: "",
  descriptionUz: "",
  descriptionRu: "",
  videoUrl: "",
  thumbnailUrl: "",
  durationSec: null,
  ageGroups: [],
  domains: [],
  order,
  active: true,
});

function categoryPayload(d: CategoryDraft) {
  return {
    slug: d.slug.trim(),
    kind: d.kind,
    professionId: d.professionId,
    titleUz: d.titleUz,
    titleRu: d.titleRu,
    descriptionUz: nullable(d.descriptionUz),
    descriptionRu: nullable(d.descriptionRu),
    order: d.order,
    active: d.active,
  };
}

function videoPayload(d: VideoDraft) {
  return {
    categoryId: d.categoryId,
    titleUz: d.titleUz,
    titleRu: d.titleRu,
    descriptionUz: nullable(d.descriptionUz),
    descriptionRu: nullable(d.descriptionRu),
    videoUrl: d.videoUrl.trim(),
    thumbnailUrl: nullable(d.thumbnailUrl),
    durationSec: d.durationSec,
    ageGroups: d.ageGroups,
    domains: d.domains,
    order: d.order,
    active: d.active,
  };
}

function professionPayload(d: ProfessionDraft) {
  return { slug: d.slug.trim(), titleUz: d.titleUz, titleRu: d.titleRu, order: d.order, active: d.active };
}

/** Hozir ochiq turgan forma: yangi yoki tahrirlanayotgan yo'nalish/mavzu/video. */
type Editing =
  | { type: "newProfession" }
  | { type: "profession"; id: string }
  | { type: "newCategory"; kind: Kind }
  | { type: "category"; id: string }
  | { type: "newVideo"; categoryId: string }
  | { type: "video"; id: string }
  | null;

export default function AdminContent() {
  const [categories, setCategories] = React.useState<Category[] | null>(null);
  const [professions, setProfessions] = React.useState<Profession[]>([]);
  /** Tanlangan yo'nalish filtri: "" — barchasi */
  const [professionFilter, setProfessionFilter] = React.useState("");
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [editing, setEditing] = React.useState<Editing>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const load = React.useCallback(async () => {
    setError("");
    try {
      const data = await api("/api/admin/content", "GET");
      setCategories(data.categories ?? []);
      setProfessions(data.professions ?? []);
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

  function removeCategory(c: Category) {
    const extra = c.videos.length ? ` Ichidagi ${c.videos.length} ta video ham o'chadi.` : "";
    if (!confirm(`"${c.titleUz}" mavzusini o'chirasizmi?${extra}`)) return;
    run(() => api(`/api/admin/content/${c.id}`, "DELETE"), "Mavzu o'chirildi");
  }

  function removeProfession(p: Profession) {
    if (!confirm(`"${p.titleUz}" yo'nalishini o'chirasizmi?`)) return;
    run(async () => {
      await api(`/api/admin/content/professions/${p.id}`, "DELETE");
      setProfessionFilter("");
    }, "Yo'nalish o'chirildi");
  }

  const professionTitle = (id: string) => professions.find((p) => p.id === id)?.titleUz ?? "—";
  const selectedProfession = professions.find((p) => p.id === professionFilter);

  function removeVideo(v: Video) {
    if (!confirm(`"${v.titleUz}" videosini o'chirasizmi?`)) return;
    run(() => api(`/api/admin/content/videos/${v.id}`, "DELETE"), "Video o'chirildi");
  }

  return (
    <div>
      <div className="text-2xl font-bold text-slate-900">Video darslar</div>
      <p className="mt-1 text-sm text-slate-600">
        Mobil ilovadagi “Darslar” va “Mashqlar” bo‘limlari shu yerdan boshqariladi: yo‘nalish (Autizm, Logoped, Sensor
        integratsiya…) → mavzu → bir yoki bir nechta video. Faqat faol yo‘nalish, mavzu va videolar ilovada ko‘rinadi.
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
      {!categories && !error && <div className="mt-6 text-sm text-slate-500">Yuklanmoqda...</div>}

      {categories && (
        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-slate-900">Yo‘nalishlar</div>
            <div className="flex items-center gap-2">
              {selectedProfession && (
                <>
                  <button className={secondaryBtn} onClick={() => setEditing({ type: "profession", id: selectedProfession.id })}>
                    Tahrirlash
                  </button>
                  <button className={dangerBtn} onClick={() => removeProfession(selectedProfession)}>
                    O‘chirish
                  </button>
                </>
              )}
              <button className={primaryBtn} onClick={() => setEditing({ type: "newProfession" })}>
                + Yo‘nalish
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[{ id: "", titleUz: "Barchasi", active: true }, ...professions].map((p) => {
              const count = categories.filter((c) => !p.id || c.professionId === p.id).length;
              const selected = professionFilter === p.id;
              return (
                <button
                  key={p.id || "all"}
                  onClick={() => setProfessionFilter(p.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  } ${p.active ? "" : "opacity-60"}`}
                >
                  {p.titleUz} · {count}
                </button>
              );
            })}
          </div>
          {editing?.type === "newProfession" && (
            <ProfessionForm
              initial={emptyProfession(professions.length)}
              onCancel={() => setEditing(null)}
              onSave={(d) => run(() => api("/api/admin/content/professions", "POST", professionPayload(d)), "Yo'nalish qo'shildi")}
            />
          )}
          {editing?.type === "profession" && selectedProfession && editing.id === selectedProfession.id && (
            <ProfessionForm
              key={selectedProfession.id}
              initial={selectedProfession}
              onCancel={() => setEditing(null)}
              onSave={(d) =>
                run(() => api(`/api/admin/content/professions/${selectedProfession.id}`, "PATCH", professionPayload(d)), "Yo'nalish saqlandi")
              }
            />
          )}
        </div>
      )}

      {categories && (
        <div className="mt-4 space-y-6">
          {(Object.keys(KIND_LABELS) as Kind[]).map((kind) => {
            const list = categories.filter((c) => c.kind === kind && (!professionFilter || c.professionId === professionFilter));
            return (
              <div key={kind} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-900">{KIND_LABELS[kind]}</div>
                  <button
                    className={primaryBtn}
                    disabled={professions.length === 0}
                    onClick={() => setEditing({ type: "newCategory", kind })}
                  >
                    + Mavzu
                  </button>
                </div>

                {editing?.type === "newCategory" && editing.kind === kind && (
                  <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                    <CategoryForm
                      initial={emptyCategory(kind, professionFilter || professions[0]?.id || "", list.length)}
                      professions={professions}
                      onCancel={() => setEditing(null)}
                      onSave={(d) => run(() => api("/api/admin/content", "POST", categoryPayload(d)), "Mavzu qo'shildi")}
                    />
                  </div>
                )}

                {list.length === 0 ? (
                  <div className="mt-3 text-xs text-slate-500">Hozircha mavzu yo‘q.</div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {list.map((c) => {
                      const isOpen = expanded.has(c.id);
                      const isEditing = editing?.type === "category" && editing.id === c.id;
                      return (
                        <div key={c.id} className="rounded-xl border border-slate-200 overflow-hidden">
                          <div className="flex items-center justify-between gap-3 p-3 bg-slate-50/80">
                            <button className="flex-1 text-left" onClick={() => toggle(c.id)}>
                              <span className="font-medium text-slate-900">
                                {isOpen ? "▾" : "▸"} {c.titleUz}
                              </span>
                              <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                                {professionTitle(c.professionId)}
                              </span>
                              <span className="ml-2 text-xs text-slate-500">
                                {c.videos.length} ta video · /{c.slug}
                              </span>
                              {!c.active && (
                                <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                                  yopiq
                                </span>
                              )}
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
                              professions={professions}
                              onCancel={() => setEditing(null)}
                              onSave={(d) =>
                                run(() => api(`/api/admin/content/${c.id}`, "PATCH", categoryPayload(d)), "Mavzu saqlandi")
                              }
                            />
                          )}

                          {isOpen && (
                            <div className="p-3 space-y-2">
                              {c.videos.length === 0 && <div className="text-xs text-slate-500">Bu mavzuda video yo‘q.</div>}
                              {c.videos.map((v) =>
                                editing?.type === "video" && editing.id === v.id ? (
                                  <VideoForm
                                    key={v.id}
                                    initial={v}
                                    onCancel={() => setEditing(null)}
                                    onSave={(d) =>
                                      run(() => api(`/api/admin/content/videos/${v.id}`, "PATCH", videoPayload(d)), "Video saqlandi")
                                    }
                                  />
                                ) : (
                                  <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium text-slate-900 truncate">
                                        {v.order}. {v.titleUz}
                                        {!v.active && <span className="ml-2 text-[11px] text-slate-500">(yopiq)</span>}
                                      </div>
                                      {videoIssues(v).length > 0 && (
                                        <div className="text-xs text-amber-700 truncate">⚠ {videoIssues(v).join(" · ")}</div>
                                      )}
                                      <div className="text-xs text-slate-500 truncate">
                                        {v.durationSec ? `${Math.round(v.durationSec / 60)} daq · ` : ""}
                                        {v.domains.length ? `Sohalar: ${v.domains.join(", ")} · ` : ""}
                                        {v.ageGroups.length
                                          ? AGE_GROUPS.filter((a) => v.ageGroups.includes(a.id)).map((a) => a.label).join(", ")
                                          : "Barcha yoshlar"}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <a href={v.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                                        Ko‘rish
                                      </a>
                                      <button className={secondaryBtn} onClick={() => setEditing({ type: "video", id: v.id })}>
                                        Tahrirlash
                                      </button>
                                      <button className={dangerBtn} onClick={() => removeVideo(v)}>
                                        O‘chirish
                                      </button>
                                    </div>
                                  </div>
                                )
                              )}

                              {editing?.type === "newVideo" && editing.categoryId === c.id ? (
                                <VideoForm
                                  initial={emptyVideo(c.id, c.videos.length + 1)}
                                  onCancel={() => setEditing(null)}
                                  onSave={(d) => run(() => api("/api/admin/content/videos", "POST", videoPayload(d)), "Video qo'shildi")}
                                />
                              ) : (
                                <button className={secondaryBtn} onClick={() => setEditing({ type: "newVideo", categoryId: c.id })}>
                                  + Video qo‘shish
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
            );
          })}
        </div>
      )}
    </div>
  );
}
