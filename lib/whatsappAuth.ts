// Sends a one-time login code via the WhatsApp Cloud API (direct Meta
// integration, no BSP middleman) using an approved "Authentication"
// category template. Needs WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
// and WHATSAPP_TEMPLATE_NAME set once the template is approved in Meta
// Business Manager — until then this throws, which the API route surfaces
// as a clear "not configured" error instead of silently failing.
export async function sendWhatsAppOtp(phone: string, code: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "otp_code";
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || "ru";

  if (!token || !phoneNumberId) {
    throw new Error("WhatsApp-авторизация ещё не настроена");
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: templateName,
        language: { code: templateLang },
        components: [
          { type: "body", parameters: [{ type: "text", text: code }] },
          // Meta's auth templates also require the code as a button
          // parameter for the "copy code" quick-action button.
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: code }],
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body?.error?.message ?? `WhatsApp API вернул ${res.status}`;
    throw new Error(message);
  }
}

// Normalizes to E.164-ish digits-only with a leading "+" — good enough for
// the Cloud API's `to` field without pulling in a full phone-parsing lib.
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  const withPlus = digits.startsWith("+") ? digits : `+${digits}`;
  return /^\+\d{9,15}$/.test(withPlus) ? withPlus : null;
}
