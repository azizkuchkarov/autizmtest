"use client";

import { useLocale } from "@/components/app/providers";
import { getPublicOffer } from "@/content/public-offer";

/** Ommaviy oferta matni (mobil ilovadagi bilan bir xil manba). */
export function OfferDocument() {
  const { locale } = useLocale();
  const doc = getPublicOffer(locale);
  return (
    <div className="flex flex-col gap-4">
      <h3 className="t-heading">{doc.title}</h3>
      <p className="t-small text-ink-3">
        {doc.subtitle} · {doc.updated}
      </p>
      <p className="t-body">{doc.preamble}</p>
      {doc.sections.map((s) => (
        <div key={s.title} className="flex flex-col gap-1">
          <h4 className="t-small-bold">{s.title}</h4>
          <p className="t-body whitespace-pre-line text-ink-2">{s.body}</p>
        </div>
      ))}
      <p className="t-small text-ink-3">{doc.footerNote}</p>
    </div>
  );
}
