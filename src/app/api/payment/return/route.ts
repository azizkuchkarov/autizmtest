import { NextResponse } from "next/server";
import { publicBaseUrl } from "@/lib/assessment-access";

/**
 * Click to'lovdan keyin shu manzilga qaytaradi (return_url).
 * Veb — natija sahifasiga, mobil ilova (app=1) — autizm://result/<id> orqali ilovaga.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("a") ?? "";
  const safeId = /^[A-Za-z0-9-]{1,64}$/.test(id) ? id : "";
  const path = safeId ? `result/${safeId}?paid=1` : "";

  if (url.searchParams.get("app") === "1") {
    return NextResponse.redirect(`autizm://${path}`, 302);
  }
  return NextResponse.redirect(`${publicBaseUrl(req)}/${path}`, 302);
}
