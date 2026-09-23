import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkPhotoQuality } from "@/lib/moderation";

const HOURLY_LIMIT = 20;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Войдите, чтобы пользоваться ИИ" }, { status: 401 });
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("assistant_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", hourAgo);

  if ((count ?? 0) >= HOURLY_LIMIT) {
    return NextResponse.json({ ok: true }); // don't block uploads on a rate limit, just skip the check
  }

  let body: { image?: string; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  if (!body.image || !body.contentType) {
    return NextResponse.json({ error: "Нет изображения" }, { status: 400 });
  }

  const result = await checkPhotoQuality(body.image, body.contentType);
  await supabase.from("assistant_usage").insert({ user_id: user.id });
  return NextResponse.json(result);
}
