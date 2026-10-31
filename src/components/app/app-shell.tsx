"use client";

import { ChartNoAxesCombined, CircleUserRound, HandHeart, House, ListChecks, MonitorPlay, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Avatar } from "@/components/app/avatar";
import { nextOnboardingStep, useLocale, useProfile } from "@/components/app/providers";
import { Reminders } from "@/components/app/reminders";
import { LanguagePill } from "@/components/app/start-scaffold";
import { BrandMark, Spinner, Wordmark } from "@/components/app/ui";
import type { TranslationKey } from "@/lib/app-i18n";
import { useActivitySync } from "@/lib/app/sync";

const TABS: { href: string; label: TranslationKey; icon: LucideIcon }[] = [
  { href: "/", label: "tabs.home", icon: House },
  { href: "/test", label: "tabs.test", icon: ListChecks },
  { href: "/lessons", label: "tabs.lessons", icon: MonitorPlay },
  { href: "/exercises", label: "tabs.exercises", icon: HandHeart },
  { href: "/progress", label: "tabs.progress", icon: ChartNoAxesCombined },
  { href: "/profile", label: "tabs.profile", icon: CircleUserRound },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Ilova yuklanayotganda (splash) — mobil ilovadagi kabi brend belgisi. */
export function AppSplash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-app">
      <BrandMark size={64} />
      <Spinner className="h-5 w-5" />
    </div>
  );
}

/** Kirish oqimi tugamagan bo'lsa tegishli qadamga yo'naltiradi. */
export function useOnboardingGate() {
  const profile = useProfile();
  const router = useRouter();
  const next = profile.loaded ? nextOnboardingStep(profile) : null;
  useEffect(() => {
    if (next) router.replace(next);
  }, [next, router]);
  return profile.loaded && !next;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const { child } = useProfile();
  const pathname = usePathname() ?? "/";
  const ready = useOnboardingGate();
  // Mashg'ulotlar tarixi akkaunt bilan sinxronlanadi (telefon almashsa yo'qolmaydi)
  useActivitySync(ready ? child?.id : null);

  if (!ready) return <AppSplash />;

  return (
    <div className="min-h-dvh bg-app">
      {/* Kompyuter: yuqori navigatsiya */}
      <header className="sticky top-0 z-30 hidden border-b border-line bg-app/85 backdrop-blur-xl md:block">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-6">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark size={32} />
            <Wordmark size={19} />
          </Link>
          <nav className="flex flex-1 items-center justify-center gap-1">
            {TABS.filter((tab) => tab.href !== "/profile").map((tab) => {
              const active = isActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`t-small-bold flex items-center gap-2 rounded-full px-4 py-2 text-[14.5px] transition-colors ${
                    active ? "bg-tint-soft text-tint" : "text-ink-2 hover:bg-muted hover:text-ink"
                  }`}
                >
                  <tab.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
                  {t(tab.label)}
                </Link>
              );
            })}
          </nav>
          <LanguagePill />
          <Link
            href="/profile"
            aria-label={t("tabs.profile")}
            className={`rounded-full p-0.5 ring-2 transition ${isActive(pathname, "/profile") ? "ring-tint" : "ring-transparent hover:ring-line"}`}
          >
            <Avatar id={child?.avatar} size={38} animated={false} />
          </Link>
        </div>
      </header>

      <div className="pb-[calc(84px+env(safe-area-inset-bottom))] md:pb-8">{children}</div>
      <Reminders />

      {/* Telefon: pastki tab bar — mobil ilova bilan bir xil */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-element/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-[600px]">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex min-w-0 flex-1 flex-col items-center gap-1 pb-2 pt-2.5"
                style={{ color: active ? "var(--tint)" : "var(--text-tertiary)" }}
              >
                <span className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-tint-soft" : ""}`}>
                  <tab.icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
                </span>
                <span className="max-w-full truncate px-0.5 text-[10.5px] font-semibold leading-none">{t(tab.label)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/** Ichki sahifalar (natija, video, markazlar) uchun orqaga tugmali sarlavha. */
export function BackHeader({ title }: { title?: string }) {
  const router = useRouter();
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
        className="t-small-bold flex items-center gap-1 rounded-full py-1.5 pr-3 text-tint hover:underline"
      >
        <span aria-hidden className="text-lg leading-none">‹</span>
        {t("common.back")}
      </button>
      {title ? <h1 className="t-heading flex-1 truncate text-center pr-16">{title}</h1> : null}
    </div>
  );
}
