// Best-effort admin notifications over the same bot used for Telegram
// login. Silently no-ops if the bot token or admin chat id aren't
// configured yet, so it never blocks the action that triggered it.
export async function notifyAdmin(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (err) {
    console.error("[telegram-notify] failed to send", err);
  }
}
