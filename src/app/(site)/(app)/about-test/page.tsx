"use client";

import { BackHeader } from "@/components/app/app-shell";
import { useLocale } from "@/components/app/providers";
import { Card, Screen } from "@/components/app/ui";
import { ABOUT_TEST } from "@/content/about-test";

/** Ilovadagi tibbiy ma'lumot manbalari (havolali), skrining tuzilishi va cheklovlari. */
export default function AboutTestPage() {
  const { t, locale } = useLocale();
  const doc = ABOUT_TEST[locale];
  return (
    <Screen>
      <BackHeader title={t("about.title")} />
      <h1 className="t-title text-[24px]">📚 {doc.sourcesTitle}</h1>
      <p className="t-body text-ink-2">{doc.sourcesIntro}</p>
      {doc.sourceGroups.map((group) => (
        <Card key={group.title} className="!gap-2">
          <h2 className="t-heading text-[16.5px]">{group.title}</h2>
          {group.note ? <p className="t-small text-ink-2">{group.note}</p> : null}
          <ul className="flex flex-col gap-2">
            {group.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-0.5">
                  <span className="t-small text-[14px] leading-[20px]">{source.text}</span>
                  <span className="t-small truncate text-[12.5px] text-tint group-hover:underline">{source.url.replace(/^https:\/\/(www\.)?/, "")}</span>
                </a>
              </li>
            ))}
          </ul>
        </Card>
      ))}
      <p className="t-body mt-2 text-ink-2">{doc.intro}</p>
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
    </Screen>
  );
}
