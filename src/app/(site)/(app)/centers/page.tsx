"use client";

import { Building2, Globe, Instagram, MapPin, Phone, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BackHeader } from "@/components/app/app-shell";
import { useLocale } from "@/components/app/providers";
import { accent, Button, Card, EmptyState, FadeIn, IconBadge, OptionChip, Screen, Skeleton } from "@/components/app/ui";
import { fetchAbaCenters, type AbaCenter } from "@/lib/app/api";
import { SHOW_CENTERS } from "@/lib/app/features";

function CenterCard({ c }: { c: AbaCenter }) {
  const { t } = useLocale();
  const a = accent("centers");
  const location = [c.district, c.address].filter(Boolean).join(", ");

  return (
    <Card className="h-full !gap-0 overflow-hidden !p-0">
      {c.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- markaz rasmi admin tomonidan yuklanadi
        <img src={c.imageUrl} alt={c.name} className="aspect-[2/1] w-full object-cover" loading="lazy" />
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-[18px]">
        <div className="flex items-center gap-4">
          {!c.imageUrl ? <IconBadge icon={Building2} color={a.fg} background={a.soft} size={44} /> : null}
          <h3 className="t-heading flex-1">{c.name}</h3>
        </div>
        {location ? (
          <p className="t-small flex items-center gap-1.5 text-ink-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {location}
          </p>
        ) : null}
        {c.note ? <p className="t-body line-clamp-3">{c.note}</p> : null}
        <div className="mt-auto flex gap-2 pt-1">
          {c.phone ? (
            <div className="flex-1">
              <Button title={t("centers.call")} size="md" icon={Phone} href={`tel:${c.phone}`} />
            </div>
          ) : null}
          {c.instagram ? (
            <a
              href={c.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-[18px] border border-line bg-element px-4 font-bold text-ink hover:bg-muted"
            >
              <Instagram className="h-[18px] w-[18px]" />
              Instagram
            </a>
          ) : c.url ? (
            <a
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-[18px] border border-line bg-element px-4 font-bold text-ink hover:bg-muted"
            >
              <Globe className="h-[18px] w-[18px]" />
              Web
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

/** Bo'lim hozircha yopiq: havola orqali kirilsa bosh sahifaga qaytaradi. */
export default function CentersRoute() {
  const router = useRouter();
  useEffect(() => {
    if (!SHOW_CENTERS) router.replace("/");
  }, [router]);
  return SHOW_CENTERS ? <CentersPage /> : null;
}

function CentersPage() {
  const { t } = useLocale();
  const [items, setItems] = useState<AbaCenter[] | null>(null);
  const [error, setError] = useState(false);
  const [region, setRegion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAbaCenters()
      .then((res) => !cancelled && setItems(res.items))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(() => {
    setError(false);
    fetchAbaCenters()
      .then((res) => setItems(res.items))
      .catch(() => setError(true));
  }, []);

  const regions = useMemo(() => Array.from(new Set(items?.map((c) => c.region) ?? [])), [items]);
  const visible = items?.filter((c) => !region || c.region === region) ?? [];

  return (
    <Screen wide>
      <BackHeader />
      <div className="flex flex-col gap-1">
        <h1 className="t-title">{t("centers.title")}</h1>
        <p className="t-body text-ink-2">{t("centers.subtitle")}</p>
      </div>

      {error ? (
        <EmptyState icon={WifiOff} title={t("common.offlineTitle")} body={t("common.offline")} actionTitle={t("common.retry")} onAction={load} />
      ) : !items ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={180} radius={24} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Building2} title={t("centers.empty")} />
      ) : (
        <>
          {regions.length > 1 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:flex-wrap sm:px-6" role="radiogroup">
              <OptionChip label={t("centers.all")} selected={region === null} onClick={() => setRegion(null)} />
              {regions.map((r) => (
                <OptionChip key={r} label={r} selected={region === r} onClick={() => setRegion(r)} />
              ))}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((c, i) => (
              <FadeIn key={c.id} delay={Math.min(i, 6) * 60}>
                <CenterCard c={c} />
              </FadeIn>
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}
