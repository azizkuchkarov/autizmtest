"use client";

import React from "react";

/*
 * Videolar — sodda boshqaruv: fayl yuklash, nom, bo'lim. Qolganini server o'zi qiladi
 * (siqish, muqova, davomiylik — scripts/video-worker.mjs). Bo'limlar va kam ishlatiladigan
 * sozlamalar: /admin/content/sections.
 */

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
  status: "ready" | "processing" | "failed";
  sourceFile: string | null;
  processError: string | null;
};

type Category = { id: string; kind: Kind; professionId: string; titleUz: string; order: number; active: boolean; videos: Video[] };
type Profession = { id: string; titleUz: string };

const TABS: { kind: Kind; label: string; hint: string }[] = [
  { kind: "lesson", label: "📚 Darslar", hint: "Ota-onalar uchun: autizm haqida va bolaga qanday yordam berish" },
  { kind: "exercise", label: "🧸 Mashqlar", hint: "Bola bilan birga bajariladigan mashqlar" },
];

const AGE_GROUPS = [
  { id: "AGE_1_5_2", label: "1,5–2 yosh" },
  { id: "AGE_3_4", label: "3–4 yosh" },
  { id: "AGE_5_6", label: "5–6 yosh" },
  { id: "AGE_7_9", label: "7–9 yosh" },
];

const DOMAINS = [
  { id: "A", label: "Ijtimoiy aloqa" },
  { id: "B", label: "Muloqot va til" },
  { id: "C", label: "Takroriy xatti-harakatlar" },
];

const input = "w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500";
const label = "mb-1.5 block text-sm font-semibold text-slate-800";

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

/** Faylni yuklaydi va foizni xabar qiladi (fetch yuklash foizini bermaydi — XHR). */
function uploadFile(file: File, onProgress: (pct: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/video");
    xhr.setRequestHeader("x-file-name", encodeURIComponent(file.name));
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText || "{}");
      if (xhr.status >= 200 && xhr.status < 300 && data.uploadId) resolve(data.uploadId);
      else reject(new Error(data.error || `Yuklab bo'lmadi (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Internet uzildi. Qayta urinib ko'ring."));
    xhr.send(file);
  });
}

function formatDuration(sec: number | null) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** "1-mashq", "3-blok" kabi nomlar ota-onaga video nima haqida ekanini aytmaydi. */
function isGenericTitle(title: string) {
  return /^[\p{L}\s]*[—–-]?\s*\d+\s*[-–]?\s*(mashq|blok|dars|qism|video)$/iu.test(title.trim()) || /^\d+$/.test(title.trim());
}

function StatusBadge({ v }: { v: Video }) {
  if (v.status === "processing" || v.sourceFile)
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">⏳ Tayyorlanmoqda</span>;
  if (v.status === "failed") return <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">⚠ Xato</span>;
  if (!v.active) return <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">Yashirin</span>;
  return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">● Ilovada</span>;
}

function VideoCard({
  v,
  categoryTitle,
  onEdit,
  onMove,
  first,
  last,
}: {
  v: Video;
  categoryTitle: string;
  onEdit: () => void;
  onMove: (dir: -1 | 1) => void;
  first: boolean;
  last: boolean;
}) {
  const dur = formatDuration(v.durationSec);
  const warnings = [isGenericTitle(v.titleUz) && "nom tushunarsiz", !v.descriptionUz?.trim() && "tavsif yo'q"].filter(Boolean);
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      <button onClick={onEdit} className="relative aspect-video w-full bg-gradient-to-br from-indigo-500 to-violet-600 text-left">
        {v.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-4xl text-white/80">▶</span>
        )}
        {dur ? <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">{dur}</span> : null}
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onEdit} className="text-left text-sm font-semibold leading-snug text-slate-900 hover:text-indigo-700">
            {v.titleUz}
          </button>
        </div>
        <div className="text-xs text-slate-500">{categoryTitle}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge v={v} />
          {warnings.length ? <span className="text-xs text-amber-700">⚠ {warnings.join(" · ")}</span> : null}
        </div>
        {v.processError ? <div className="text-xs text-rose-600">Xato: {v.processError}</div> : null}
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex gap-1">
            <button disabled={first} onClick={() => onMove(-1)} title="Yuqoriga" className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30">
              ↑
            </button>
            <button disabled={last} onClick={() => onMove(1)} title="Pastga" className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30">
              ↓
            </button>
          </div>
          <button onClick={onEdit} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200">
            Tahrirlash
          </button>
        </div>
      </div>
    </div>
  );
}

type Draft = {
  categoryId: string;
  titleUz: string;
  descriptionUz: string;
  titleRu: string;
  descriptionRu: string;
  ageGroups: string[];
  domains: string[];
  active: boolean;
  videoUrl: string;
};

function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-slate-200">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-700 group-open:border-b group-open:border-slate-200">{title}</summary>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </details>
  );
}

function Checks({ options, value, onChange }: { options: { id: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(on ? value.filter((x) => x !== o.id) : [...value, o.id])}
            className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300 text-slate-600"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function VideoEditor({
  video,
  categories,
  professionTitle,
  defaultCategoryId,
  onClose,
  onSaved,
}: {
  video: Video | null;
  categories: Category[];
  professionTitle: (id: string) => string;
  defaultCategoryId: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [d, setD] = React.useState<Draft>(() => ({
    categoryId: video?.categoryId ?? defaultCategoryId,
    titleUz: video?.titleUz ?? "",
    descriptionUz: video?.descriptionUz ?? "",
    titleRu: video?.titleRu ?? "",
    descriptionRu: video?.descriptionRu ?? "",
    ageGroups: video?.ageGroups ?? [],
    domains: video?.domains ?? [],
    active: video?.active ?? true,
    videoUrl: video?.videoUrl ?? "",
  }));
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));
  const [file, setFile] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [uploadId, setUploadId] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const uploading = !!file && !uploadId && !uploadError;

  async function startUpload(f: File) {
    if (!f.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(f.name)) {
      setUploadError("Bu video fayl emas. MP4 yoki MOV tanlang.");
      return;
    }
    setFile(f);
    setUploadId(null);
    setUploadError("");
    setProgress(0);
    try {
      setUploadId(await uploadFile(f, setProgress));
      // Nom bo'sh bo'lsa — fayl nomidan taklif
      setD((prev) => (prev.titleUz ? prev : { ...prev, titleUz: f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Yuklab bo'lmadi");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!video && !uploadId && !d.videoUrl.trim()) {
      alert("Avval video faylni yuklang.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        categoryId: d.categoryId,
        titleUz: d.titleUz.trim(),
        titleRu: d.titleRu.trim(),
        descriptionUz: d.descriptionUz.trim() || null,
        descriptionRu: d.descriptionRu.trim() || null,
        ageGroups: d.ageGroups,
        domains: d.domains,
        active: d.active,
        ...(uploadId ? { uploadId } : d.videoUrl.trim() && d.videoUrl !== video?.videoUrl ? { videoUrl: d.videoUrl.trim() } : {}),
      };
      if (video) await api(`/api/admin/content/videos/${video.id}`, "PATCH", payload);
      else {
        const siblings = categories.find((c) => c.id === d.categoryId)?.videos ?? [];
        await api("/api/admin/content/videos", "POST", { ...payload, order: Math.max(0, ...siblings.map((v) => v.order)) + 1 });
      }
      onSaved(
        uploadId
          ? "Saqlandi. Server videoni tayyorlamoqda — bir necha daqiqadan keyin ilovada avtomatik chiqadi."
          : "Saqlandi.",
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!video || !confirm(`"${video.titleUz}" videosini butunlay o'chirasizmi?`)) return;
    try {
      await api(`/api/admin/content/videos/${video.id}`, "DELETE");
      onSaved("Video o'chirildi.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xatolik");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-xl flex-col gap-5 rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-slate-900">{video ? "Videoni tahrirlash" : "Yangi video"}</div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>

        {/* 1. Fayl */}
        <div>
          <div className={label}>1. Video fayl {video ? "" : "*"}</div>
          <input
            ref={fileInput}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && startUpload(e.target.files[0])}
          />
          <div
            onClick={() => !uploading && fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f && !uploading) startUpload(f);
            }}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition ${dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400"}`}
          >
            {file ? (
              <div className="flex flex-col gap-2">
                <div className="truncate text-sm font-semibold text-slate-800">{file.name}</div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full ${uploadError ? "bg-rose-500" : "bg-indigo-600"} transition-all`} style={{ width: `${progress}%` }} />
                </div>
                <div className="text-xs text-slate-500">
                  {uploadError ? (
                    <span className="text-rose-600">{uploadError} — qayta tanlash uchun bosing</span>
                  ) : uploadId ? (
                    <span className="text-emerald-700">✓ Yuklandi. Saqlang — server videoni o&apos;zi tayyorlaydi.</span>
                  ) : (
                    `Yuklanmoqda… ${progress}% (oynani yopmang)`
                  )}
                </div>
              </div>
            ) : video ? (
              <div className="flex items-center gap-4 text-left">
                {video.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.thumbnailUrl} alt="" className="h-16 w-28 rounded-lg object-cover" />
                ) : null}
                <div className="text-sm text-slate-600">
                  Hozirgi video saqlanadi.
                  <br />
                  <span className="font-semibold text-indigo-600">Almashtirish uchun yangi faylni shu yerga tashlang</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                <div className="text-3xl">🎬</div>
                <div className="mt-1 font-semibold text-slate-800">Faylni shu yerga tashlang yoki bosib tanlang</div>
                <div className="mt-1 text-xs text-slate-500">MP4 yoki MOV, 4 GB gacha. Hajmi va sifatini server o&apos;zi telefonga moslaydi.</div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Nom va tavsif */}
        <div className="flex flex-col gap-4">
          <div>
            <label className={label}>2. Nomi *</label>
            <input
              className={input}
              value={d.titleUz}
              onChange={(e) => set({ titleUz: e.target.value })}
              placeholder="Masalan: Bolani ismiga javob berishga o'rgatish"
              required
            />
            {isGenericTitle(d.titleUz) ? (
              <p className="mt-1 text-xs text-amber-700">«1-mashq» kabi nom ota-onaga hech narsa demaydi — video nimani o&apos;rgatishini yozing.</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Ota-ona nomdan video nimani o&apos;rgatishini tushunishi kerak.</p>
            )}
          </div>
          <div>
            <label className={label}>Qisqa tavsif</label>
            <textarea
              className={input}
              rows={2}
              value={d.descriptionUz}
              onChange={(e) => set({ descriptionUz: e.target.value })}
              placeholder="Masalan: Bola ismini eshitganda qarashini o'rgatadigan 3 ta oddiy o'yin."
            />
          </div>
        </div>

        {/* 3. Bo'lim */}
        <div>
          <label className={label}>3. Bo&apos;lim *</label>
          <select className={input} value={d.categoryId} onChange={(e) => set({ categoryId: e.target.value })} required>
            <option value="" disabled>
              Tanlang…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titleUz} · {professionTitle(c.professionId)}
              </option>
            ))}
          </select>
        </div>

        <Disclosure title="Ruscha matn (ixtiyoriy)">
          <p className="-mt-1 text-xs text-slate-500">Bo&apos;sh qolsa, rus tilidagi foydalanuvchilarga o&apos;zbekchasi ko&apos;rsatiladi.</p>
          <div>
            <label className={label}>Название</label>
            <input className={input} value={d.titleRu} onChange={(e) => set({ titleRu: e.target.value })} />
          </div>
          <div>
            <label className={label}>Описание</label>
            <textarea className={input} rows={2} value={d.descriptionRu} onChange={(e) => set({ descriptionRu: e.target.value })} />
          </div>
        </Disclosure>

        <Disclosure title="Qo'shimcha sozlamalar">
          <label className="flex items-center gap-3 text-sm text-slate-800">
            <input type="checkbox" checked={d.active} onChange={(e) => set({ active: e.target.checked })} className="h-4 w-4" />
            Ilovada ko&apos;rsatilsin
          </label>
          <div>
            <div className={label}>Qaysi yoshdagi bolalar uchun</div>
            <Checks options={AGE_GROUPS} value={d.ageGroups} onChange={(ageGroups) => set({ ageGroups })} />
            <p className="mt-1 text-xs text-slate-500">Hech biri tanlanmasa — barcha yoshlar uchun.</p>
          </div>
          <div>
            <div className={label}>Skrining natijasiga qarab tavsiya qilinsin</div>
            <Checks options={DOMAINS} value={d.domains} onChange={(domains) => set({ domains })} />
            <p className="mt-1 text-xs text-slate-500">Natijada shu soha bo&apos;yicha qiyinchilik bo&apos;lsa, video &quot;Siz uchun mashqlar&quot;da chiqadi.</p>
          </div>
          <div>
            <div className={label}>Fayl o&apos;rniga havola</div>
            <input className={input} value={d.videoUrl} onChange={(e) => set({ videoUrl: e.target.value })} placeholder="https://… (YouTube emas, to'g'ridan-to'g'ri MP4)" />
          </div>
        </Disclosure>

        <div className="flex items-center justify-between gap-3 pt-1">
          {video ? (
            <button type="button" onClick={remove} className="text-sm font-semibold text-rose-600 hover:underline">
              O&apos;chirish
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading ? "Yuklanmoqda…" : saving ? "Saqlanmoqda…" : "Saqlash"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function AdminVideos() {
  const [categories, setCategories] = React.useState<Category[] | null>(null);
  const [professions, setProfessions] = React.useState<Profession[]>([]);
  const [kind, setKind] = React.useState<Kind>("lesson");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [editing, setEditing] = React.useState<Video | "new" | null>(null);
  const [notice, setNotice] = React.useState("");
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const data = await api("/api/admin/content", "GET");
      setCategories(data.categories ?? []);
      setProfessions(data.professions ?? []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yuklab bo'lmadi");
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Tayyorlanayotgan video bo'lsa — holat avtomatik yangilanadi
  const processing = categories?.some((c) => c.videos.some((v) => v.status === "processing" || v.sourceFile)) ?? false;
  React.useEffect(() => {
    if (!processing) return;
    const timer = setInterval(load, 10_000);
    return () => clearInterval(timer);
  }, [processing, load]);

  const kindCategories = (categories ?? []).filter((c) => c.kind === kind);
  const shown = kindCategories.filter((c) => !categoryFilter || c.id === categoryFilter);
  const professionTitle = (id: string) => professions.find((p) => p.id === id)?.titleUz ?? "";
  const count = (k: Kind) => (categories ?? []).filter((c) => c.kind === k).reduce((n, c) => n + c.videos.length, 0);

  async function move(c: Category, index: number, dir: -1 | 1) {
    const list = [...c.videos].sort((a, b) => a.order - b.order);
    const a = list[index];
    const b = list[index + dir];
    if (!a || !b) return;
    // Tartib raqamlari bir xil bo'lsa ham to'g'ri almashishi uchun indeksdan foydalanamiz
    await Promise.all([
      api(`/api/admin/content/videos/${a.id}`, "PATCH", { order: index + dir }),
      api(`/api/admin/content/videos/${b.id}`, "PATCH", { order: index }),
    ]).catch((e) => alert(e instanceof Error ? e.message : "Xatolik"));
    load();
  }

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-bold text-slate-900">Videolar</div>
          <p className="mt-1 text-sm text-slate-600">Ota-onalar ilovada ko&apos;radigan videolar. Yangi video qo&apos;shilsa, ilovada avtomatik chiqadi.</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/admin/content/sections" className="text-sm text-slate-500 hover:text-slate-800 hover:underline">
            Bo&apos;limlar va sozlamalar
          </a>
          <button onClick={() => setEditing("new")} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            + Video qo&apos;shish
          </button>
        </div>
      </div>

      {notice ? (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
          {notice}
          <button onClick={() => setNotice("")} className="text-emerald-700">
            ✕
          </button>
        </div>
      ) : null}
      {error ? <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200">{error}</div> : null}

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.kind}
            onClick={() => {
              setKind(t.kind);
              setCategoryFilter("");
            }}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${kind === t.kind ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {t.label} <span className="ml-1 text-xs text-slate-400">{count(t.kind)}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-500">{TABS.find((t) => t.kind === kind)!.hint}</p>

      {kindCategories.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {[{ id: "", titleUz: "Barchasi" }, ...kindCategories].map((c) => (
            <button
              key={c.id || "all"}
              onClick={() => setCategoryFilter(c.id)}
              className={`rounded-full border px-3 py-1.5 text-sm ${categoryFilter === c.id ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
            >
              {c.titleUz}
            </button>
          ))}
        </div>
      ) : null}

      {categories === null ? (
        <div className="mt-10 text-sm text-slate-500">Yuklanmoqda…</div>
      ) : shown.every((c) => c.videos.length === 0) ? (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center text-sm text-slate-600">
          Hali video yo&apos;q.{" "}
          <button onClick={() => setEditing("new")} className="font-semibold text-indigo-600 hover:underline">
            Birinchi videoni qo&apos;shing
          </button>
        </div>
      ) : (
        shown
          .filter((c) => c.videos.length > 0)
          .map((c) => {
            const list = [...c.videos].sort((a, b) => a.order - b.order);
            return (
              <section key={c.id} className="mt-8">
                <div className="mb-3 text-sm font-bold text-slate-900">
                  {c.titleUz} <span className="font-normal text-slate-400">· {professionTitle(c.professionId)}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((v, i) => (
                    <VideoCard
                      key={v.id}
                      v={v}
                      categoryTitle={c.titleUz}
                      onEdit={() => setEditing(v)}
                      onMove={(dir) => move(c, i, dir)}
                      first={i === 0}
                      last={i === list.length - 1}
                    />
                  ))}
                </div>
              </section>
            );
          })
      )}

      {editing ? (
        <VideoEditor
          video={editing === "new" ? null : editing}
          categories={kindCategories}
          professionTitle={professionTitle}
          defaultCategoryId={categoryFilter || kindCategories[0]?.id || ""}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice(message);
            load();
          }}
        />
      ) : null}
    </div>
  );
}
