import { NextResponse } from "next/server";
import { getAssessmentAccess } from "@/lib/assessment-access";

/** Natija qulflanganmi (to'lov kerakmi). Serverda topilmagan natija (oflayn) qulflanmaydi. */
export async function GET(_req: Request, { params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  const access = await getAssessmentAccess(assessmentId);
  return NextResponse.json({ locked: access.locked, amount: access.amount }, { headers: { "Cache-Control": "no-store" } });
}
