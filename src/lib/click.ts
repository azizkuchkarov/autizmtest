/**
 * Click to'lov integratsiyasi.
 * .env: CLICK_MERCHANT_ID, CLICK_SERVICE_ID, CLICK_SECRET_KEY, CLICK_MERCHANT_USER_ID
 * Prepare va Complete URL larni Click merchant panelida ro'yxatdan o'tkazing.
 */

import { createHash } from "crypto";

const CLICK_API = "https://api.click.uz/v2/merchant";

function getAuthHeader(): string {
  const merchantUserId = process.env.CLICK_MERCHANT_USER_ID;
  const secretKey = process.env.CLICK_SECRET_KEY;
  if (!merchantUserId || !secretKey) {
    throw new Error("CLICK_MERCHANT_USER_ID va CLICK_SECRET_KEY .env da kerak.");
  }
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const digest = createHash("sha1").update(timestamp + secretKey).digest("hex");
  return `${merchantUserId}:${digest}:${timestamp}`;
}

export async function createInvoice(params: {
  phone: string;
  amount: number;
  merchantTransId: string;
}): Promise<{ invoiceId?: number; errorCode?: number; errorNote?: string }> {
  const serviceId = process.env.CLICK_SERVICE_ID;
  if (!serviceId) throw new Error("CLICK_SERVICE_ID .env da kerak.");

  const phone = params.phone.replace(/\D/g, "");
  const mobilePhone = phone.length === 9 && phone.startsWith("9") ? "998" + phone : phone;
  if (!/^998\d{9}$/.test(mobilePhone)) {
    return { errorCode: -1, errorNote: "Telefon noto'g'ri" };
  }

  const res = await fetch(`${CLICK_API}/invoice/create`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Auth: getAuthHeader(),
    },
    body: JSON.stringify({
      service_id: parseInt(serviceId, 10),
      amount: params.amount,
      phone_number: mobilePhone,
      merchant_trans_id: params.merchantTransId,
    }),
  });
  const data = (await res.json()) as { error_code?: number; error_note?: string; invoice_id?: number };
  return {
    invoiceId: data.invoice_id,
    errorCode: data.error_code ?? (res.ok ? 0 : -1),
    errorNote: data.error_note,
  };
}

/** Prepare uchun sign tekshiruvi. Params: click_trans_id, service_id, merchant_trans_id, amount, action, sign_time, sign_string */
export function verifyPrepareSign(params: Record<string, string | number>): boolean {
  const secretKey = process.env.CLICK_SECRET_KEY;
  if (!secretKey) return false;
  const str =
    String(params.click_trans_id) +
    params.service_id +
    secretKey +
    params.merchant_trans_id +
    params.amount +
    params.action +
    params.sign_time;
  const hash = createHash("md5").update(str).digest("hex");
  return hash === String(params.sign_string).toLowerCase();
}

/** Complete uchun sign tekshiruvi */
export function verifyCompleteSign(params: Record<string, string | number>): boolean {
  const secretKey = process.env.CLICK_SECRET_KEY;
  if (!secretKey) return false;
  const str =
    String(params.click_trans_id) +
    params.service_id +
    secretKey +
    params.merchant_trans_id +
    params.merchant_prepare_id +
    params.amount +
    params.action +
    params.sign_time;
  const hash = createHash("md5").update(str).digest("hex");
  return hash === String(params.sign_string).toLowerCase();
}
