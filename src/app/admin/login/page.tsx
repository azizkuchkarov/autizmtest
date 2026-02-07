"use client";

import React from "react";

export default function AdminLoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Kirishda xatolik.");
        return;
      }
      window.location.href = "/admin";
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <div className="text-xl font-bold text-slate-900">Admin kirish</div>
      <p className="mt-1 text-sm text-slate-600">Email va parolni kiriting</p>
      <div className="mt-4 space-y-3">
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Parol"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Kutilmoqda..." : "Kirish"}
        </button>
      </div>
    </form>
  );
}
