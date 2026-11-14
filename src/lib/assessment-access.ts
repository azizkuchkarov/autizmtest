import { prisma } from "@/lib/db";
import { getPaymentAmount, isAssessmentLocked, paymentsVisible } from "@/lib/payment-config";

export type AssessmentAccess = { found: boolean; locked: boolean; amount: number | null };

/** Natijaga kirish holati: qulflangan bo'lsa narx ham qaytadi. */
export async function getAssessmentAccess(assessmentId: string): Promise<AssessmentAccess> {
  const a = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { requiresPayment: true, payment: { select: { status: true } } },
  });
  if (!a) return { found: false, locked: false, amount: null };
  const locked = isAssessmentLocked(a, await paymentsVisible());
  return { found: true, locked, amount: locked ? getPaymentAmount() : null };
}

/** Click qaytgandan keyin yo'naltiriladigan sayt manzili. */
export function publicBaseUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}
