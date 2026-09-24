import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moderateText } from "@/lib/moderation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  let body: { name?: string; priceText?: string; description?: string; imageUrl?: string };
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

  const { error } = await supabase
    .from("catalog_items")
    .update({
      name,
      price_text: body.priceText?.trim() || null,
      description: body.description?.trim() || null,
      ...(body.imageUrl ? { image_url: body.imageUrl } : {}),
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
