import { sym, type IconName } from '@/components/ui';
import type { AccentName } from '@/constants/theme';

/** Skrining sohalari uchun ikonka va aksent rang. */
export const DOMAIN_STYLE: Record<string, { icon: IconName; accent: AccentName }> = {
  A: { icon: sym('person.2.fill', 'group'), accent: 'test' },
  B: { icon: sym('bubble.left.and.bubble.right.fill', 'forum'), accent: 'lessons' },
  C: { icon: sym('arrow.triangle.2.circlepath', 'autorenew'), accent: 'exercises' },
};

export function domainStyle(id: string) {
  return DOMAIN_STYLE[id] ?? DOMAIN_STYLE.A;
}
