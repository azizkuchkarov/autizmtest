"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Avatar, avatarsFor } from "@/components/app/avatar";
import { useLocale, useProfile } from "@/components/app/providers";
import { StartScaffold } from "@/components/app/start-scaffold";
import { Button, FadeIn } from "@/components/app/ui";

function AvatarScreen() {
  const params = useSearchParams();
  const { t } = useLocale();
  const { child, saveChild } = useProfile();
  const router = useRouter();

  // Faqat avatarni almashtirish uchun profildan ochilganda parametrlar bo'lmaydi
  const name = params.get("name") ?? child?.name ?? "";
  const birthYear = Number(params.get("birthYear") ?? child?.birthYear ?? 0);
  const birthMonth = Number(params.get("birthMonth") ?? child?.birthMonth ?? 0) || null;
  const gender = params.get("gender") ?? child?.gender ?? "O'g'il";
  const options = avatarsFor(gender);
  const isEdit = !!params.get("edit") || !params.get("name");

  const initial = child?.gender === gender && child.avatar ? child.avatar : options[0].id;

  const [selected, setSelected] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onSave = async () => {
    setSaving(true);
    setError("");
    try {
      await saveChild({ name, birthYear, birthMonth, gender, avatar: selected });
      if (isEdit && child) router.replace("/profile");
      else router.replace("/start/routine");
    } catch (e) {
      setError(e instanceof Error && e.message !== "Network error" ? e.message : t("common.offline"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StartScaffold
      step={isEdit && child ? undefined : t("avatar.step")}
      footer={
        <>
          {error ? <p className="t-small text-center text-danger">{error}</p> : null}
          <Button title={t("avatar.save")} onClick={onSave} loading={saving} icon={Check} />
        </>
      }
    >
      <FadeIn className="flex flex-col gap-2">
        <h1 className="t-title">{t("avatar.title").replace("{name}", name)}</h1>
        <p className="t-body text-ink-2">{t("avatar.subtitle")}</p>
      </FadeIn>

      <div className="my-2 flex flex-col items-center gap-4">
        <motion.span
          key={selected}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="inline-flex rounded-full bg-element p-2 shadow-[0_10px_20px_rgb(30_27_75/0.12)]"
        >
          <Avatar id={selected} size={168} />
        </motion.span>
        <span className="t-subtitle">{name}</span>
      </div>

      <div className="grid grid-cols-4 justify-items-center gap-1 sm:mx-auto sm:gap-6">
        {options.map((a, i) => {
          const isSelected = a.id === selected;
          return (
            <FadeIn key={a.id} delay={80 * i}>
              <button
                onClick={() => setSelected(a.id)}
                aria-pressed={isSelected}
                className="relative rounded-full border-[3px] p-1 transition-transform active:scale-[0.95]"
                style={{ borderColor: isSelected ? "var(--tint)" : "transparent" }}
              >
                <Avatar id={a.id} size={64} animated={isSelected} />
                {isSelected ? (
                  <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-app bg-tint text-white">
                    <Check className="h-3 w-3" strokeWidth={3.5} />
                  </span>
                ) : null}
              </button>
            </FadeIn>
          );
        })}
      </div>
    </StartScaffold>
  );
}

function AvatarRoute() {
  const { loaded } = useProfile();
  // Profil brauzerdan o'qilgach ochiladi — joriy avatar boshlang'ich tanlov bo'ladi
  return loaded ? <AvatarScreen /> : null;
}

export default function AvatarPage() {
  return (
    <Suspense>
      <AvatarRoute />
    </Suspense>
  );
}
