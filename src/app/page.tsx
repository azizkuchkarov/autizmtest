import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function Home() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-8">
        <div className="fixed top-4 right-4 z-50 animate-fadeIn">
          <DarkModeToggle />
        </div>

        <section className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-8 md:p-12 shadow-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 hover-lift animate-fadeIn mb-8">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-200/30 dark:bg-indigo-900/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-emerald-200/30 dark:bg-emerald-900/20 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 dark:bg-indigo-900/30 px-4 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-100/70 dark:ring-indigo-800/60">
              Autism Screening • Premium
              <span className="rounded-full bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200/70 dark:ring-indigo-700/60">
                Expert aligned
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
              Har bir bola o‘ziga xos.
              <br />
              Ba’zida esa qo‘shimcha e’tibor kerak bo‘ladi.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              Autizm belgilarini erta bosqichda aniqlash uchun ota-onalar uchun mo‘ljallangan skrining testi.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { title: "5 blok", desc: "Ijtimoiy, nutq, sensor, o‘yin va takroriy xatti-harakatlar" },
                { title: "50 savol", desc: "Har bir blok 10 ta savoldan iborat" },
                { title: "15–20 daqiqa", desc: "Qisqa va tushunarli format" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl bg-white/80 dark:bg-slate-900/60 p-4 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm"
                >
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{item.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-slate-900/40 p-4 ring-1 ring-emerald-100/70 dark:ring-emerald-800/50">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Test savollari xalqaro amaliyotga mos holda ishlab chiqilgan. Natijalar ota-onaga oddiy va tushunarli
                tilda taqdim etiladi.
              </p>
            </div>
            <div className="mt-8">
              <Link
                href="/start"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 dark:from-indigo-500 dark:via-indigo-400 dark:to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/40 transition-all hover:from-indigo-700 hover:via-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-600 dark:hover:via-indigo-500 dark:hover:to-indigo-700 hover:shadow-2xl hover:-translate-y-0.5"
              >
                Kirish
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
