// Pure types/helpers shared between server (lib/catalog.ts) and client
// components — kept separate because lib/catalog.ts imports the
// server-only Supabase client (next/headers), which can't be pulled into
// a "use client" bundle even just for these constants.

export type CatalogCurrency = "USD" | "KZT" | "RUB";

export const CURRENCY_SYMBOLS: Record<CatalogCurrency, string> = {
  USD: "$",
  KZT: "₸",
  RUB: "₽",
};

export const CURRENCY_LABELS: Record<CatalogCurrency, string> = {
  USD: "Доллар USD $",
  KZT: "Тенге ₸",
  RUB: "Рубли ₽",
};

export interface CatalogSpec {
  label: string;
  value: string;
}

export function formatCatalogPrice(item: { priceText: string | null; priceOnRequest: boolean; currency: CatalogCurrency }): string {
  if (item.priceOnRequest) return "Цена по запросу";
  if (!item.priceText) return "";
  return `Цена: ${item.priceText} ${CURRENCY_SYMBOLS[item.currency]}`;
}
