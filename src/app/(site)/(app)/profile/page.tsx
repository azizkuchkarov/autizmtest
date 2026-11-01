"use client";

import { BarChart3, BellRing, BookOpen, Building2, ClipboardList, FileText, HandHeart, Info, LogOut, MonitorPlay, Pencil, Phone, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/app/avatar";
import { useLocale, useProfile } from "@/components/app/providers";
import { accent, Button, Card, ConfirmDialog, ListRow, PageHeader, Screen, SectionHeader, Segmented } from "@/components/app/ui";
import type { TranslationKey } from "@/lib/app-i18n";
import { formatAge } from "@/lib/app/age";
import { SHOW_CENTERS } from "@/lib/app/features";
import { listAssessments, useAssessmentsVersion } from "@/lib/app/history";
import { ageInMonths } from "@/lib/screening-v3/score";

/** +998901234567 → "+998 90 123 45 67" */
function prettyPhone(phone: string) {
  const d = phone.replace(/\D/g, "").slice(3);
  return d.length === 9 ? `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}` : phone;
}

export default function ProfilePage() {
  const { t, locale, setLocale } = useLocale();
  const { child, phone, signOut, deleteAccount, signedIn } = useProfile();
  const router = useRouter();
  const test = accent("test");
  const lessons = accent("lessons");
  const exercises = accent("exercises");
  const centers = accent("centers");
  const [testsCount, setTestsCount] = useState(0);
  const [dialog, setDialog] = useState<"logout" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const assessmentsVersion = useAssessmentsVersion();
  useEffect(() => {
    listAssessments().then((items) => setTestsCount(items.length));
  }, [assessmentsVersion]);

  const details = [child ? String(child.birthYear) : null, child ? formatAge(ageInMonths(child.birthYear, child.birthMonth), locale) : null, child ? t(`gender.${child.gender}` as TranslationKey) : null]
    .filter(Boolean)
    .join(" · ");

  const onConfirm = async () => {
    setBusy(true);
    try {
      if (dialog === "logout") await signOut();
      else {
        setDeleteError("");
        await deleteAccount();
      }
      setDialog(null);
      router.replace("/");
    } catch {
      setDeleteError(t("profile.deleteAccountFailed"));
      setDialog(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <PageHeader title={t("profile.title")} />

      <div className="flex flex-col gap-4 rounded-[24px] border border-line bg-element p-6 shadow-card">
        <div className="flex items-center gap-4">
          <Link href="/start/avatar" className="relative" aria-label={t("profile.changeAvatar")}>
            <Avatar id={child?.avatar} size={84} />
            <span className="absolute -right-0.5 bottom-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-element bg-tint text-white">
              <Pencil className="h-3 w-3" strokeWidth={2.6} />
            </span>
          </Link>
          <div className="flex-1">
            <span className="t-caption text-ink-3">{t("profile.childCard")}</span>
            <h2 className="t-subtitle">{child?.name || t("profile.noName")}</h2>
            {details ? <p className="t-small text-ink-2">{details}</p> : null}
          </div>
        </div>
        <div className="flex items-baseline gap-2 rounded-2xl bg-muted px-4 py-3">
          <span className="t-number">{testsCount}</span>
          <span className="t-small text-ink-2">{t("profile.testsCount")}</span>
        </div>
        <Button title={t("profile.editChild")} variant="ghost" size="md" icon={Pencil} href="/start/child?edit=1" />
      </div>

      <SectionHeader title={t("profile.language")} />
      <Segmented
        options={[
          { value: "uz", label: "O'zbekcha" },
          { value: "ru", label: "Русский" },
        ]}
        value={locale}
        onChange={setLocale}
      />

      <SectionHeader title={t("profile.sectionApp")} />
      <Card className="!gap-0 overflow-hidden !p-0">
        <ListRow icon={BookOpen} iconColor={test.fg} iconBackground={test.soft} title={t("profile.guide")} href="/start/guide?again=1" />
        <ListRow
          icon={BellRing}
          iconColor={exercises.fg}
          iconBackground={exercises.soft}
          title={t("profile.routine")}
          value={child?.practiceTime ?? undefined}
          href="/start/routine?edit=1"
        />
        <ListRow icon={BarChart3} iconColor={test.fg} iconBackground={test.soft} title={t("profile.history")} value={String(testsCount)} href="/test" />
        <ListRow icon={MonitorPlay} iconColor={lessons.fg} iconBackground={lessons.soft} title={t("lessons.title")} href="/lessons" />
        <ListRow icon={HandHeart} iconColor={exercises.fg} iconBackground={exercises.soft} title={t("exercises.title")} href="/exercises" last={!SHOW_CENTERS} />
        {SHOW_CENTERS ? (
          <ListRow icon={Building2} iconColor={centers.fg} iconBackground={centers.soft} title={t("profile.centers")} href="/centers" last />
        ) : null}
      </Card>

      <SectionHeader title={t("profile.about")} />
      <Card className="!gap-0 overflow-hidden !p-0">
        {phone ? (
          <ListRow icon={Phone} iconColor="var(--text-secondary)" iconBackground="var(--muted)" title={t("profile.phone")} value={prettyPhone(phone)} />
        ) : null}
        <ListRow icon={ClipboardList} iconColor="var(--text-secondary)" iconBackground="var(--muted)" title={t("about.title")} href="/about-test" />
        <ListRow icon={Shield} iconColor="var(--text-secondary)" iconBackground="var(--muted)" title={t("profile.privacy")} href={`/privacy#${locale}`} />
        <ListRow icon={FileText} iconColor="var(--text-secondary)" iconBackground="var(--muted)" title={t("offer.title")} href="/offer" />
        <ListRow icon={Info} iconColor="var(--text-secondary)" iconBackground="var(--muted)" title={t("profile.version")} value="1.0.0" last />
      </Card>
      <p className="t-small px-1 text-ink-3">
        {t("profile.aboutBody")} {t("home.disclaimer")}
      </p>

      <Button title={t("profile.logout")} variant="secondary" size="md" icon={LogOut} onClick={() => setDialog("logout")} />
      {signedIn ? (
        <button onClick={() => setDialog("delete")} className="t-small self-center p-2 text-danger hover:underline">
          {t("profile.deleteAccount")}
        </button>
      ) : null}
      {deleteError ? <p className="t-small text-center text-danger">{deleteError}</p> : null}

      <ConfirmDialog
        open={dialog !== null}
        title={dialog === "delete" ? t("profile.deleteAccount") : t("profile.logout")}
        body={dialog === "delete" ? t("profile.deleteAccountConfirm") : t("profile.logoutConfirm")}
        confirmLabel={dialog === "delete" ? t("profile.deleteAccount") : t("profile.logout")}
        cancelLabel={t("common.cancel")}
        destructive
        loading={busy}
        onConfirm={onConfirm}
        onCancel={() => setDialog(null)}
      />
    </Screen>
  );
}
