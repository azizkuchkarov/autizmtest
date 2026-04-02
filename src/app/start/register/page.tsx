"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/translations";

/** Eski havola: OTP sahifasi olib tashlandi — dastlabki ma'lumotlar `/start` da. */
export default function StartRegisterRedirectPage() {
  const router = useRouter();
  const t = useTranslations();

  React.useEffect(() => {
    router.replace("/start");
  }, [router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <p className="text-sm text-slate-600 dark:text-slate-400">{t("common.loading")}</p>
    </div>
  );
}
