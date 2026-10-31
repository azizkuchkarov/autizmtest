"use client";

import { OfferDocument } from "@/components/app/offer-document";
import { useLocale } from "@/components/app/providers";
import { StartScaffold } from "@/components/app/start-scaffold";
import { Card } from "@/components/app/ui";

/** Ommaviy oferta — profil va kirish oqimidan ochiladi. */
export default function OfferPage() {
  const { t } = useLocale();
  return (
    <StartScaffold>
      <h1 className="t-title">{t("offer.title")}</h1>
      <Card className="mb-10">
        <OfferDocument />
      </Card>
    </StartScaffold>
  );
}
