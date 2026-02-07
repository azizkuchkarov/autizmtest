"use client";

import React from "react";

type AbaCenter = {
  id: string;
  region: string;
  name: string;
  phone?: string;
  address?: string;
  note?: string;
};

const REGIONS = [
  "Andijon",
  "Buxoro",
  "Farg‘ona",
  "Jizzax",
  "Namangan",
  "Navoiy",
  "Qashqadaryo",
  "Samarqand",
  "Sirdaryo",
  "Surxondaryo",
  "Toshkent",
  "Xorazm",
];

export default function AdminAbaCenters() {
  const [items, setItems] = React.useState<AbaCenter[]>([]);
  const [status, setStatus] = React.useState("");

  React.useEffect(() => {
    fetch("/api/admin/aba-centers")
      .then((r) => r.json())
      .then((data) => {
        const existing: AbaCenter[] = Array.isArray(data.items) ? data.items : [];
        if (existing.length > 0) {
          setItems(existing);
          return;
        }
        const seeded = REGIONS.map((region, idx) => ({
          id: `new-${idx}`,
          region,
          name: "",
          phone: "",
          address: "",
          note: "",
        }));
        setItems(seeded);
      });
  }, []);

  function update(index: number, patch: Partial<AbaCenter>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addCenter(region: string) {
    setItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        region,
        name: "",
        phone: "",
        address: "",
        note: "",
      },
    ]);
  }

  function removeCenter(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  async function save() {
    setStatus("Saqlanmoqda...");
    const payload = items
      .map((it, idx) => ({
        ...it,
        order: idx,
        active: Boolean(it.name || it.phone || it.address || it.note),
      }))
      .filter((it) => it.active);
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
        {REGIONS.map((region) => {
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
                <div className="mt-3 space-y-3">
                  {list.map((it) => {
                    const idx = items.findIndex((x) => x.id === it.id);
                    return (
                      <div key={it.id} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-slate-600">Markaz</div>
                          <button
                            type="button"
                            onClick={() => removeCenter(it.id)}
                            className="text-xs text-rose-600 hover:underline"
                          >
                            O‘chirish
                          </button>
                        </div>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            placeholder="Izoh (ixtiyoriy)"
                            value={it.note || ""}
                            onChange={(e) => update(idx, { note: e.target.value })}
                          />
                        </div>
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
