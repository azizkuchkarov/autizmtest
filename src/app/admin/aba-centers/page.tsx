"use client";

import React from "react";
import { ABA_REGIONS, TOSHKENT_SHAHAR_DISTRICTS, isToshkentShahar } from "@/data/regions";

type AbaCenterAmenity = { title: string; imageUrl: string };

type AbaCenter = {
  id: string;
  region: string;
  district?: string | null;
  name: string;
  phone?: string;
  address?: string;
  url?: string;
  instagram?: string;
  note?: string;
  imageUrl?: string;
  directorName?: string;
  directorImageUrl?: string;
  directorBio?: string;
  amenities?: AbaCenterAmenity[];
  portfolioDescription?: string;
  telegramId?: string | null;
  active?: boolean;
};

export default function AdminAbaCenters() {
  const [items, setItems] = React.useState<AbaCenter[]>([]);
  const [status, setStatus] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/aba-centers")
      .then((r) => r.json())
      .then((data) => {
        const existing: AbaCenter[] = Array.isArray(data.items) ? data.items : [];
        if (existing.length > 0) {
          setItems(existing);
          return;
        }
        const seeded = ABA_REGIONS.map((region, idx) => ({
          id: `new-${idx}`,
          region,
          district: null as string | null,
          name: "",
          phone: "",
          address: "",
          url: "",
          instagram: "",
          note: "",
          imageUrl: "",
          directorName: "",
          directorImageUrl: "",
          directorBio: "",
          amenities: [] as AbaCenterAmenity[],
          portfolioDescription: "",
          telegramId: null as string | null,
          active: true,
        }));
        setItems(seeded);
      });
  }, []);

  function update(index: number, patch: Partial<AbaCenter>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addCenter(region: string) {
    const newId = `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        region,
        district: isToshkentShahar(region) ? "" : null,
        name: "",
        phone: "",
        address: "",
        url: "",
        instagram: "",
        note: "",
        imageUrl: "",
        directorName: "",
        directorImageUrl: "",
        directorBio: "",
        amenities: [] as AbaCenterAmenity[],
        portfolioDescription: "",
        telegramId: null,
        active: true,
      },
    ]);
    setExpandedId(newId);
  }

  async function uploadImage(index: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/aba-centers/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || "Rasm yuklanmadi");
      return;
    }
    const data = await res.json();
    if (data?.url) update(index, { imageUrl: data.url });
  }

  async function uploadDirectorImage(index: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/aba-centers/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || "Rasm yuklanmadi");
      return;
    }
    const data = await res.json();
    if (data?.url) update(index, { directorImageUrl: data.url });
  }

  function updateAmenity(centerIdx: number, amenityIdx: number, patch: Partial<AbaCenterAmenity>) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== centerIdx) return it;
        const list = [...(it.amenities || [])];
        list[amenityIdx] = { ...list[amenityIdx], ...patch };
        return { ...it, amenities: list };
      })
    );
  }

  async function uploadAmenityImage(centerIdx: number, amenityIdx: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/aba-centers/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || "Rasm yuklanmadi");
      return;
    }
    const data = await res.json();
    if (data?.url) updateAmenity(centerIdx, amenityIdx, { imageUrl: data.url });
  }

  function addAmenity(centerIdx: number) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === centerIdx
          ? { ...it, amenities: [...(it.amenities || []), { title: "", imageUrl: "" }] }
          : it
      )
    );
  }

  function removeAmenity(centerIdx: number, amenityIdx: number) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === centerIdx
          ? { ...it, amenities: (it.amenities || []).filter((_, j) => j !== amenityIdx) }
          : it
      )
    );
  }

  function removeCenter(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  async function save() {
    setStatus("Saqlanmoqda...");
    const payload = items.map((it, idx) => ({
      ...it,
      order: idx,
      active: true,
    }));
    const res = await fetch("/api/admin/aba-centers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload }),
    });
    setStatus(res.ok ? "Saqlandi" : "Xatolik");
  }

  return (
    <div>
      <div className="text-2xl font-bold text-slate-900">ABA markazlar</div>
      <p className="mt-1 text-sm text-slate-600">
        Har bir viloyat uchun alohida ma’lumot kiriting. Bo‘sh qolsa saqlanmaydi.
      </p>

      <div className="mt-4 space-y-6">
        {ABA_REGIONS.map((region) => {
          const list = items.filter((x) => x.region === region);
          return (
            <div key={region} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-slate-900">{region}</div>
                <button
                  type="button"
                  onClick={() => addCenter(region)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  + Markaz qo‘shish
                </button>
              </div>

              {list.length === 0 ? (
                <div className="mt-3 text-xs text-slate-500">Hozircha markaz yo‘q.</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {list.map((it) => {
                    const idx = items.findIndex((x) => x.id === it.id);
                    const isExpanded = expandedId === it.id;
                    return (
                      <div key={it.id} className="rounded-xl border border-slate-200 overflow-hidden">
                        {!isExpanded ? (
                          <div className="flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-100/80">
                            <span className="font-medium text-slate-900">
                              {it.name?.trim() || "Yangi markaz (nomini kiriting)"}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setExpandedId(it.id)}
                                className="rounded-lg bg-slate-200 hover:bg-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                              >
                                O‘zgartirish
                              </button>
                              <button
                                type="button"
                                onClick={() => removeCenter(it.id)}
                                className="text-xs text-rose-600 hover:underline"
                              >
                                Ro‘yxatdan o‘chirish
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50/80">
                              <span className="text-xs font-semibold text-slate-600">Markaz ma’lumotlari</span>
                              <button
                                type="button"
                                onClick={() => setExpandedId(null)}
                                className="rounded-lg bg-slate-200 hover:bg-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                              >
                                Yopish
                              </button>
                            </div>
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {isToshkentShahar(it.region) && (
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-slate-600 mb-1">Tuman</label>
                              <select
                                className="rounded-xl border border-slate-300 px-3 py-2 text-sm w-full"
                                value={it.district || ""}
                                onChange={(e) => update(idx, { district: e.target.value || null })}
                              >
                                <option value="">Tumanni tanlang</option>
                                {TOSHKENT_SHAHAR_DISTRICTS.map((d) => (
                                  <option key={d} value={d}>
                                    {d}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <input
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Markaz nomi"
                            value={it.name || ""}
                            onChange={(e) => update(idx, { name: e.target.value })}
                          />
                          <input
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Telefon"
                            value={it.phone || ""}
                            onChange={(e) => update(idx, { phone: e.target.value })}
                          />
                          <input
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                            placeholder="Manzil"
                            value={it.address || ""}
                            onChange={(e) => update(idx, { address: e.target.value })}
                          />
                          <input
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                            placeholder="URL address (veb-sayt, sahifa)"
                            value={it.url || ""}
                            onChange={(e) => update(idx, { url: e.target.value })}
                          />
                          <input
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                            placeholder="Instagram profil (havola)"
                            value={it.instagram || ""}
                            onChange={(e) => update(idx, { instagram: e.target.value })}
                          />
                          <input
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                            placeholder="Telegram ID (chat_id) — Ro'yxatga yozilish xabarlari shu yerga yuboriladi"
                            value={it.telegramId ?? ""}
                            onChange={(e) => update(idx, { telegramId: e.target.value.trim() || null })}
                          />
                          <div className="md:col-span-2">
                            <span className="block text-xs font-medium text-slate-600 mb-1">Rasm (faqat yuklash)</span>
                            {it.imageUrl ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <img src={it.imageUrl} alt="" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                                <label className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium cursor-pointer hover:bg-slate-200">
                                  Almashtirish
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) uploadImage(idx, f);
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => update(idx, { imageUrl: "" })}
                                  className="text-xs text-rose-600 hover:underline"
                                >
                                  O‘chirish
                                </button>
                              </div>
                            ) : (
                              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                                Rasm tanlash (JPEG, PNG, 5 MB gacha)
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) uploadImage(idx, f);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                          <input
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                            placeholder="Izoh (ixtiyoriy)"
                            value={it.note || ""}
                            onChange={(e) => update(idx, { note: e.target.value })}
                          />

                          <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2">
                            <div className="text-xs font-semibold text-slate-700 mb-3">Portfolio (Batafsil modal)</div>
                            <div className="space-y-3">
                              <input
                                className="rounded-xl border border-slate-300 px-3 py-2 text-sm w-full"
                                placeholder="Markaz rahbari (F.I.O)"
                                value={it.directorName || ""}
                                onChange={(e) => update(idx, { directorName: e.target.value })}
                              />
                              <textarea
                                className="rounded-xl border border-slate-300 px-3 py-2 text-sm w-full min-h-[80px]"
                                placeholder="Rahbar ish faoliyati / qisqacha tavsif"
                                value={it.directorBio || ""}
                                onChange={(e) => update(idx, { directorBio: e.target.value })}
                              />
                              <div>
                                <span className="block text-xs font-medium text-slate-600 mb-1">Rahbar rasmi</span>
                                {it.directorImageUrl ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <img src={it.directorImageUrl} alt="" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                                    <label className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium cursor-pointer hover:bg-slate-200">
                                      Almashtirish
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="hidden"
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) uploadDirectorImage(idx, f);
                                        }}
                                      />
                                    </label>
                                    <button type="button" onClick={() => update(idx, { directorImageUrl: "" })} className="text-xs text-rose-600 hover:underline">
                                      O‘chirish
                                    </button>
                                  </div>
                                ) : (
                                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                                    Rasm yuklash
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp,image/gif"
                                      className="hidden"
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) uploadDirectorImage(idx, f);
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                              <textarea
                                className="rounded-xl border border-slate-300 px-3 py-2 text-sm w-full min-h-[60px]"
                                placeholder="Markaz haqida (portfolio matni)"
                                value={it.portfolioDescription || ""}
                                onChange={(e) => update(idx, { portfolioDescription: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-slate-700">Qulayliklar (sarlavha + rasm)</span>
                              <button
                                type="button"
                                onClick={() => addAmenity(idx)}
                                className="rounded-lg bg-indigo-100 text-indigo-700 px-2 py-1 text-xs font-medium hover:bg-indigo-200"
                              >
                                + Qo‘shish
                              </button>
                            </div>
                            <div className="space-y-2">
                              {(it.amenities || []).map((am, aIdx) => (
                                <div key={aIdx} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-2">
                                  <input
                                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm flex-1 min-w-[120px]"
                                    placeholder="Qulaylik nomi"
                                    value={am.title}
                                    onChange={(e) => updateAmenity(idx, aIdx, { title: e.target.value })}
                                  />
                                  {am.imageUrl ? (
                                    <>
                                      <img src={am.imageUrl} alt="" className="h-10 w-10 object-cover rounded-lg border" />
                                      <label className="text-xs text-slate-600 cursor-pointer hover:underline">Almashtirish
                                        <input
                                          type="file"
                                          accept="image/jpeg,image/png,image/webp,image/gif"
                                          className="hidden"
                                          onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) uploadAmenityImage(idx, aIdx, f);
                                          }}
                                        />
                                      </label>
                                    </>
                                  ) : (
                                    <label className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs cursor-pointer hover:bg-slate-50">
                                      Rasm
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="hidden"
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) uploadAmenityImage(idx, aIdx, f);
                                        }}
                                      />
                                    </label>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeAmenity(idx, aIdx)}
                                    className="text-xs text-rose-600 hover:underline"
                                  >
                                    O‘chirish
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                          </>
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

      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
          Saqlash
        </button>
        <div className="text-sm text-slate-600">{status}</div>
      </div>
    </div>
  );
}
