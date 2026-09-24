import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moderateText } from "@/lib/moderation";

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
    description?: string;
    imageUrl?: string;
    images?: string[];
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

  const check = await moderateText(`${name} ${body.description ?? ""}`);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason ?? "Не прошло модерацию" }, { status: 422 });
  }

  const { data, error } = await supabase
    .from("catalog_items")
    .insert({
      company_id: companyId,
      type,
      name: name.trim(),
      price_text: body.priceOnRequest ? null : body.priceText?.trim() || null,
      price_on_request: Boolean(body.priceOnRequest),
      description: body.description?.trim() || null,
      image_url: body.imageUrl || null,
      images: body.images && body.images.length > 0 ? body.images : body.imageUrl ? [body.imageUrl] : [],
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
    const priceLine = body.priceOnRequest ? "\nЦена по запросу" : body.priceText?.trim() ? `\nЦена: ${body.priceText.trim()}` : "";
    const descLine = body.description?.trim() ? `\n${body.description.trim()}` : "";
    await supabase.from("posts").insert({
      author_id: user.id,
      company_id: companyId,
      catalog_item_id: data.id,
      topic: type === "product" ? "Товары" : "Услуги",
      body: `${label} от ${company?.name ?? "компании"}: ${name.trim()}${priceLine}${descLine}`,
      media_urls: body.imageUrl ? [body.imageUrl] : [],
    });
  } catch (postErr) {
    console.error("[catalog] failed to create feed post for new item", postErr);
  }

  return NextResponse.json({ item: data });
}
