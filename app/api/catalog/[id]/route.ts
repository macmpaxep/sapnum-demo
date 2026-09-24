import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moderateText } from "@/lib/moderation";
import type { CatalogCurrency } from "@/lib/catalog";

const VALID_CURRENCIES = new Set(["USD", "KZT", "RUB"]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  let body: {
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

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Введите название" }, { status: 400 });

  const check = await moderateText(`${name} ${body.description ?? ""}`);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason ?? "Не прошло модерацию" }, { status: 422 });
  }

  const specs = body.specs
    ? body.specs.map((s) => ({ label: s.label?.trim() ?? "", value: s.value?.trim() ?? "" })).filter((s) => s.label && s.value)
    : undefined;

  if (specs && specs.length < 2) {
    return NextResponse.json({ error: "Укажите хотя бы 2 характеристики — это помогает покупателям сравнивать" }, { status: 400 });
  }

  const currency: CatalogCurrency | undefined = body.currency
    ? VALID_CURRENCIES.has(body.currency)
      ? (body.currency as CatalogCurrency)
      : "KZT"
    : undefined;

  const { error } = await supabase
    .from("catalog_items")
    .update({
      name,
      price_text: body.priceOnRequest ? null : body.priceText?.trim() || null,
      price_on_request: Boolean(body.priceOnRequest),
      ...(currency ? { currency } : {}),
      description: body.description?.trim() || null,
      ...(body.imageUrl ? { image_url: body.imageUrl } : {}),
      ...(body.images ? { images: body.images } : {}),
      ...(specs ? { specs } : {}),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { error } = await supabase.from("catalog_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
