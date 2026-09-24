import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moderateText } from "@/lib/moderation";
import { notifyAdmin } from "@/lib/telegramNotify";
import { CURRENCY_SYMBOLS, type CatalogCurrency } from "@/lib/catalog";

const VALID_CURRENCIES = new Set(["USD", "KZT", "RUB"]);

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  let body: {
    companyId?: string;
    type?: "product" | "service";
    name?: string;
    priceText?: string;
    priceOnRequest?: boolean;
    currency?: string;
    description?: string;
    imageUrl?: string;
    images?: string[];
    specs?: { label?: string; value?: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const { companyId, type, name } = body;
  if (!companyId || (type !== "product" && type !== "service") || !name?.trim()) {
    return NextResponse.json({ error: "Заполните название и тип" }, { status: 400 });
  }

  const specs = (body.specs ?? [])
    .map((s) => ({ label: s.label?.trim() ?? "", value: s.value?.trim() ?? "" }))
    .filter((s) => s.label && s.value);

  if (specs.length < 2) {
    return NextResponse.json({ error: "Укажите хотя бы 2 характеристики — это помогает покупателям сравнивать" }, { status: 400 });
  }

  const check = await moderateText(`${name} ${body.description ?? ""}`);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason ?? "Не прошло модерацию" }, { status: 422 });
  }

  const currency: CatalogCurrency = VALID_CURRENCIES.has(body.currency ?? "") ? (body.currency as CatalogCurrency) : "KZT";

  const { data, error } = await supabase
    .from("catalog_items")
    .insert({
      company_id: companyId,
      type,
      name: name.trim(),
      price_text: body.priceOnRequest ? null : body.priceText?.trim() || null,
      price_on_request: Boolean(body.priceOnRequest),
      currency,
      description: body.description?.trim() || null,
      image_url: body.imageUrl || null,
      images: body.images && body.images.length > 0 ? body.images : body.imageUrl ? [body.imageUrl] : [],
      specs,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // New catalog items surface in the main feed as a post, same as any other
  // update — discovery should happen by scrolling, not by visiting the
  // catalog separately. Best-effort: a failure here shouldn't fail the
  // catalog item itself.
  try {
    const { data: company } = await supabase.from("companies").select("name").eq("id", companyId).single();
    const label = type === "product" ? "Новый товар" : "Новая услуга";
    const priceLine = body.priceOnRequest
      ? "\nЦена по запросу"
      : body.priceText?.trim()
        ? `\nЦена: ${body.priceText.trim()} ${CURRENCY_SYMBOLS[currency]}`
        : "";
    const trimmedDescription = body.description?.trim() ?? "";
    const shortDescription = trimmedDescription.length > 120 ? `${trimmedDescription.slice(0, 120).trimEnd()}…` : trimmedDescription;
    const descLine = shortDescription ? `\n${shortDescription}` : "";
    const media = body.images && body.images.length > 0 ? body.images : body.imageUrl ? [body.imageUrl] : [];
    await supabase.from("posts").insert({
      author_id: user.id,
      company_id: companyId,
      catalog_item_id: data.id,
      topic: type === "product" ? "Товары" : "Услуги",
      body: `${label} от ${company?.name ?? "компании"}: ${name.trim()}${priceLine}${descLine}`,
      media_urls: media,
    });
  } catch (postErr) {
    console.error("[catalog] failed to create feed post for new item", postErr);
  }

  notifyAdmin(`📦 Новый ${type === "product" ? "товар" : "услуга"}: ${name.trim()}`);

  return NextResponse.json({ item: data });
}
