// Client-safe helpers for the contact rows on a company page.
export type ContactType = "phone" | "whatsapp" | "telegram" | "email" | "address" | "other";
export interface CompanyContact {
  type: ContactType;
  value: string;
}

export const CONTACT_TYPES: { value: ContactType; label: string; placeholder: string }[] = [
  { value: "phone", label: "Телефон", placeholder: "+7 707 123 4567" },
  { value: "whatsapp", label: "WhatsApp", placeholder: "+7 707 123 4567" },
  { value: "telegram", label: "Telegram", placeholder: "@username" },
  { value: "email", label: "Email", placeholder: "info@company.kz" },
  { value: "address", label: "Адрес", placeholder: "г. Алматы, ул. Абая 1" },
  { value: "other", label: "Другое", placeholder: "Описание или ссылка" },
];

export const MAX_CONTACTS = 10;
export const MAX_CONTACT_LENGTH = 120;

// Domestic KZ/RU numbers are often typed as 8 707…; tel:/wa.me need the 7 prefix.
const digits = (s: string) => {
  const d = s.replace(/[^\d]/g, "");
  return d.length === 11 && d.startsWith("8") ? `7${d.slice(1)}` : d;
};

// Builds a safe link for a contact, or null when it's plain text (address, other).
// Only ever emits tel:/mailto:/https: URLs assembled from sanitized parts.
export function contactHref(c: CompanyContact): string | null {
  const v = c.value.trim();
  switch (c.type) {
    case "phone": {
      const d = digits(v);
      return d ? `tel:+${d}` : null;
    }
    case "whatsapp": {
      const d = digits(v);
      return d ? `https://wa.me/${d}` : null;
    }
    case "telegram": {
      const handle = v.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "").replace(/^@/, "").split(/[/?#\s]/)[0];
      return /^[A-Za-z0-9_]{3,64}$/.test(handle) ? `https://t.me/${handle}` : null;
    }
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? `mailto:${v}` : null;
    default:
      return null;
  }
}

// Server-side validation of whatever the client sent. Returns a cleaned list.
export function sanitizeContacts(input: unknown): CompanyContact[] | null {
  if (!Array.isArray(input) || input.length > MAX_CONTACTS) return null;
  const allowed = new Set<string>(CONTACT_TYPES.map((t) => t.value));
  const out: CompanyContact[] = [];
  for (const raw of input) {
    const type = (raw as CompanyContact)?.type;
    const value = typeof (raw as CompanyContact)?.value === "string" ? (raw as CompanyContact).value.trim() : "";
    if (!allowed.has(type)) return null;
    if (!value) continue;
    if (value.length > MAX_CONTACT_LENGTH) return null;
    out.push({ type, value });
  }
  return out;
}
