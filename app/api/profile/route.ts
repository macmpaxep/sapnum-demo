import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moderateText } from "@/lib/moderation";

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  let body: {
    displayName?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    goal?: string;
    interests?: string[];
    onboardingCompleted?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.displayName !== undefined) {
    const displayName = body.displayName.trim();
    if (!displayName) return NextResponse.json({ error: "Укажите ФИО" }, { status: 400 });
    const check = await moderateText(displayName);
    if (!check.allowed) return NextResponse.json({ error: check.reason ?? "Недопустимое имя" }, { status: 422 });
    update.display_name = displayName;
  }

  if (body.username !== undefined) {
    const username = body.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!username || username.length < 3) {
      return NextResponse.json({ error: "Юзернейм должен быть от 3 символов (только латиница, цифры, _)" }, { status: 400 });
    }
    const { data: taken } = await supabase.from("profiles").select("id").eq("username", username).neq("id", user.id).maybeSingle();
    if (taken) return NextResponse.json({ error: "Этот юзернейм уже занят" }, { status: 409 });
    update.username = username;
  }

  if (body.bio !== undefined) {
    const bio = body.bio.trim();
    if (bio) {
      const check = await moderateText(bio);
      if (!check.allowed) return NextResponse.json({ error: check.reason ?? "Недопустимое описание" }, { status: 422 });
    }
    update.bio = bio || null;
  }

  if (body.avatarUrl !== undefined) {
    update.avatar_url = body.avatarUrl || null;
  }

  if (body.goal !== undefined) {
    update.goal = body.goal || null;
  }

  if (body.interests !== undefined) {
    update.interests = body.interests;
  }

  if (body.onboardingCompleted !== undefined) {
    update.onboarding_completed = body.onboardingCompleted;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
