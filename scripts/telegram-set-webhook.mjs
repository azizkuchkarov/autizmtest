// Telegram botga webhook manzilini o'rnatadi (serverda bir marta, token o'zgarsa qayta):
//   node --env-file=.env scripts/telegram-set-webhook.mjs
// .env: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET; ixtiyoriy PUBLIC_URL (default https://autizmtest.uz)

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const base = (process.env.PUBLIC_URL || "https://autizmtest.uz").replace(/\/$/, "");
if (!token || !secret) {
  console.error("TELEGRAM_BOT_TOKEN va TELEGRAM_WEBHOOK_SECRET .env da bo'lishi kerak.");
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then((r) => r.json());

const me = await api("getMe");
if (!me.ok) {
  console.error("Token noto'g'ri:", me.description);
  process.exit(1);
}
const set = await api("setWebhook", {
  url: `${base}/api/telegram/webhook`,
  secret_token: secret,
  allowed_updates: ["message"],
  drop_pending_updates: true,
});
console.log(`@${me.result.username}: setWebhook ${set.ok ? "OK" : "XATO — " + set.description}`);
const info = await api("getWebhookInfo");
console.log("Webhook:", info.result?.url, info.result?.last_error_message ? `(oxirgi xato: ${info.result.last_error_message})` : "");
