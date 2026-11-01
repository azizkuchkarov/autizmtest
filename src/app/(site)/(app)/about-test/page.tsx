"use client";

import { BackHeader } from "@/components/app/app-shell";
import { useLocale } from "@/components/app/providers";
import { Card, Screen } from "@/components/app/ui";
import { ABOUT_TEST } from "@/content/about-test";

/** Skrining qanday tuzilgani, manbalari va cheklovlari. */
export default function AboutTestPage() {
  const { t, locale } = useLocale();
  const doc = ABOUT_TEST[locale];
  return (
    <Screen>
      <BackHeader title={t("about.title")} />
      <p className="t-body text-ink-2">{doc.intro}</p>
      {doc.sections.map((s) => (
        <Card key={s.title} className="!gap-2.5">
          <h2 className="t-heading text-[16.5px]">{s.title}</h2>
          <ul className="flex flex-col gap-2.5">
            {s.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tint" />
                <span className="t-small flex-1 text-[14.5px] leading-[21px]">{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
      <Card flat className="!gap-2">
        <h2 className="t-heading text-[16.5px]">{doc.sourcesTitle}</h2>
        {doc.sources.map((source) => (
          <p key={source} className="t-small text-ink-2">
            {source}
          </p>
        ))}
      </Card>
    </Screen>
  );
}
