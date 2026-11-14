import { NextResponse } from "next/server";

/**
 * Click to'lovdan keyin shu manzilga qaytaradi (return_url).
 * Veb — Darslar sahifasiga, mobil ilova (app=1) — autizm://lessons orqali ilovaga.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("app") === "1") {
    return NextResponse.redirect("autizm://lessons?paid=1", 302);
  }
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const base = env || (host ? `${proto}://${host}` : url.origin);
  return NextResponse.redirect(`${base}/lessons?paid=1`, 302);
}
