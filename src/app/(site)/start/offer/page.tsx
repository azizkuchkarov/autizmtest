"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, FileText, Gift, ShieldCheck, Stethoscope, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { OfferDocument } from "@/components/app/offer-document";
import { useLocale, useProfile } from "@/components/app/providers";
import { StartScaffold } from "@/components/app/start-scaffold";
import { accent, Button, Card, FadeIn, IconBadge, type AccentName } from "@/components/app/ui";
import type { TranslationKey } from "@/lib/app-i18n";

const POINTS: { icon: LucideIcon; accent: AccentName; title: TranslationKey; body: TranslationKey }[] = [
  { icon: Stethoscope, accent: "test", title: "offer.point1Title", body: "offer.point1Body" },
  { icon: ShieldCheck, accent: "exercises", title: "offer.point2Title", body: "offer.point2Body" },
  { icon: Gift, accent: "lessons", title: "offer.point3Title", body: "offer.point3Body" },
];

export default function OfferPage() {
  const { t } = useLocale();
  const { acceptOffer } = useProfile();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const onContinue = () => {
    acceptOffer();
    router.replace("/");
  };

  return (
    <StartScaffold
      back={false}
      footer={
        <>
          <label className="flex cursor-pointer items-center gap-4 py-2">
            <input type="checkbox" className="peer sr-only" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span
              className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg border-2 text-white peer-focus-visible:ring-2 peer-focus-visible:ring-tint"
              style={{ borderColor: agreed ? "var(--tint)" : "var(--border)", background: agreed ? "var(--tint)" : "var(--element)" }}
            >
              {agreed ? <Check className="h-3.5 w-3.5" strokeWidth={3.5} /> : null}
            </span>
            <span className="t-small flex-1">{t("offer.agree")}</span>
          </label>
          <Button title={t("offer.continue")} onClick={onContinue} disabled={!agreed} icon={ArrowRight} />
        </>
      }
    >
      <FadeIn className="flex flex-col gap-2">
        <h1 className="t-title">{t("offer.title")}</h1>
        <p className="t-body text-ink-2">{t("offer.subtitle")}</p>
      </FadeIn>

      <FadeIn delay={100}>
        <Card className="!gap-6 !py-6">
          {POINTS.map((p) => {
            const a = accent(p.accent);
            return (
              <div key={p.title} className="flex items-start gap-4">
                <IconBadge icon={p.icon} color={a.fg} background={a.soft} size={42} />
                <div className="flex flex-1 flex-col gap-0.5">
                  <h3 className="t-heading text-[15.5px]">{t(p.title)}</h3>
                  <p className="t-small text-ink-2">{t(p.body)}</p>
                </div>
              </div>
            );
          })}
        </Card>
      </FadeIn>

      <FadeIn delay={180}>
        <Card className="!gap-0 overflow-hidden !p-0">
          <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-4 p-[18px] text-left hover:bg-muted">
            <FileText className="h-[18px] w-[18px] text-tint" />
            <span className="t-heading flex-1 text-[15.5px]">{t("offer.readFull")}</span>
            <ChevronDown className="h-4 w-4 text-ink-3 transition-transform" style={{ transform: expanded ? "rotate(180deg)" : undefined }} />
          </button>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-line"
              >
                <div className="p-[18px]">
                  <OfferDocument />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </FadeIn>
    </StartScaffold>
  );
}
