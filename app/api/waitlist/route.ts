import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: string; company?: string; industry?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const email = body.email?.trim();
  const company = body.company?.trim();
  const industry = body.industry?.trim();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Укажите корректный email" }, { status: 400 });
  }
  if (!company) {
    return NextResponse.json({ error: "Укажите название компании" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    // Supabase isn't configured yet — log so the submission isn't silently lost
    // during local development or before env vars are set on the server.
    console.log("[waitlist] Supabase not configured, received:", {
      email,
      company,
      industry,
    });
    return NextResponse.json({ ok: true, stored: false });
  }

  const { error } = await supabase.from("waitlist").insert({
    email,
    company,
    industry,
  });

  if (error) {
    // Duplicate email is fine — treat as success so the user isn't blocked.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, stored: true });
    }
    console.error("[waitlist] Supabase insert error:", error.message);
    return NextResponse.json(
      { error: "Не удалось сохранить заявку, попробуйте ещё раз" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, stored: true });
}
