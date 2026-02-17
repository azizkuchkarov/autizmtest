import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";
import { TEST_TYPE_LABELS } from "@/lib/test-types";

export default function Home() {
  return (
    <div className="min-h-dvh bg-slate-50/80 dark:bg-slate-950 transition-colors duration-300">
      <div className="fixed top-4 right-4 z-50">
        <DarkModeToggle />
      </div>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pb-20 pt-10 sm:pt-12">
        {/* Hero — ota-onalarni jalb qiluvchi matn */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-8 md:p-12 mb-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-200/30 dark:bg-indigo-900/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-emerald-200/30 dark:bg-emerald-900/20 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Farzandingiz rivojlanishi — sizning tinchligingiz
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-slate-900 dark:text-slate-100">
              Bola alomatlarini erta bilish,
              <br />
              <span className="text-indigo-600 dark:text-indigo-400">to‘g‘ri qadam tashlashga</span> yordam beradi.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Biz ota-onalar uchun professional, savolnoma uslubidagi <strong>autizmni aniqlash</strong> skrining testini taqdim etamiz.
              3 asosiy soha (ijtimoiy aloqa, muloqot, cheklangan/takroriy va sezgi xatti-harakatlari) bo‘yicha savollar orqali
              bolaning rivojlanishini baholashga yordam beradi.
            </p>
            <div className="mt-8">
              <Link
                href="/start"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5"
              >
                Testni boshlash
                <span className="text-white/90">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Testlar haqida alohida ma'lumot */}
        <section className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Tanlov</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-6">
            Qaysi test sizga kerak?
          </h2>
          <div className="grid gap-6 md:grid-cols-1">
            {/* Autizmni aniqlash — skrining */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 md:p-8 transition hover:shadow-2xl hover:shadow-slate-200/30 dark:hover:shadow-black/30">
              <div className="inline-flex rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-200">
                Skrining
              </div>
              <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {TEST_TYPE_LABELS.screening}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Farzandingizda autizm belgilarini erta aniqlash uchun professional ota-ona so‘rovnomasi.
                Savollar yosh guruhiga moslashtirilgan (1,5–2, 3–4, 5–6, 7–9 yosh) va 3 asosiy soha bo‘yicha: ijtimoiy aloqa,
                muloqot, cheklangan/takroriy va sezgi xatti-harakatlari.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                <li>• 4 javob varianti: Yo‘q, Kamdan-kam, Ko‘pincha, Doim</li>
                <li>• 3 soha: ijtimoiy aloqa, muloqot, cheklangan/takroriy va sezgi xatti-harakatlari</li>
                <li>• Umumiy risk foizi, bloklar bo‘yicha profil, red-flag savollar va AI xulosa</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Qisqa eslatma */}
        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50 p-5 sm:p-6">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-slate-100">Eslatma:</strong> Testlar tibbiy tashxis emas. Yakuniy baho va reja uchun mutaxassis (pediatr,
            bolalar nevrologi yoki rivoj mutaxassisi) bilan muloqot qilishingiz tavsiya etiladi.
          </p>
        </section>
      </main>
    </div>
  );
}
