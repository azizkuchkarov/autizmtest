"use client";

import { ChevronLeft, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { useLocale } from "@/components/app/providers";
import { BrandMark, Wordmark } from "@/components/app/ui";

/** Til almashtirgich (UZ / RU) — kirish ekranlarining yuqori o'ng burchagida. */
export function LanguagePill() {
  const { locale, setLocale } = useLocale();
  return (
    <button
      onClick={() => setLocale(locale === "uz" ? "ru" : "uz")}
      className="t-small-bold flex items-center gap-1.5 rounded-full border border-line bg-element px-3 py-[7px] text-ink-2 hover:bg-muted"
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === "uz" ? "O'zbek" : "Русский"}
    </button>
  );
}

/** Kirish oqimi ekranlari uchun umumiy karkas: orqaga tugma, qadam, kontent va pastki tugma. */
export function StartScaffold({ children, footer, step, back = true }: { children: ReactNode; footer?: ReactNode; step?: string; back?: boolean }) {
  const router = useRouter();
  return (
    <div className="flex min-h-dvh flex-col bg-app">
      <header className="mx-auto flex w-full max-w-[600px] items-center justify-between px-5 pb-2 pt-[max(12px,env(safe-area-inset-top))]">
        {back ? (
          <button
            onClick={() => router.back()}
            aria-label="Orqaga"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-element text-ink hover:bg-muted"
          >
            <ChevronLeft className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <span className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="hidden sm:inline">
              <Wordmark size={18} />
            </span>
          </span>
        )}
        {step ? <span className="t-small-bold text-ink-3">{step}</span> : null}
        <LanguagePill />
      </header>

      <main className="mx-auto flex w-full max-w-[600px] flex-1 flex-col gap-4 px-6 pt-4">{children}</main>

      {footer ? (
        <footer className="sticky bottom-0 bg-gradient-to-t from-app via-app to-transparent">
          <div className="mx-auto flex w-full max-w-[600px] flex-col gap-2 px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">{footer}</div>
        </footer>
      ) : null}
    </div>
  );
}
