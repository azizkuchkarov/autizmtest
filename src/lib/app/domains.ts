import { ArrowRightLeft, MessagesSquare, Users, type LucideIcon } from "lucide-react";
import type { AccentName } from "@/components/app/ui";
import type { TranslationKey } from "@/lib/app-i18n";

/** Skrining sohalari uchun ikonka va aksent rang (mobil ilova bilan bir xil). */
export const DOMAIN_STYLE: Record<string, { icon: LucideIcon; accent: AccentName; title: TranslationKey; desc: TranslationKey }> = {
  A: { icon: Users, accent: "test", title: "test.domainA", desc: "test.domainADesc" },
  B: { icon: MessagesSquare, accent: "lessons", title: "test.domainB", desc: "test.domainBDesc" },
  C: { icon: ArrowRightLeft, accent: "exercises", title: "test.domainC", desc: "test.domainCDesc" },
};

export function domainStyle(id: string) {
  return DOMAIN_STYLE[id] ?? DOMAIN_STYLE.A;
}
