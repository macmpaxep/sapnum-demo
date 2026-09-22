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
    description?: string;
    imageUrl?: string;
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
      price_text: body.priceText?.trim() || null,
      description: body.description?.trim() || null,
      image_url: body.imageUrl || null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}
