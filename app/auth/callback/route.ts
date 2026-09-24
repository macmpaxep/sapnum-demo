import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/telegramNotify";

// Handles the redirect from a Supabase magic-link email: exchanges the
// one-time code for a session, then provisions a profile/role for
// first-time email sign-ins (Telegram login does this itself; email
// sign-in has no separate API step where we could do it, so it happens
// here instead, right after the session is established).
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  // Only ever redirect to a relative in-app path — an absolute URL or
  // "//evil.com" here would be an open-redirect vector.
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/feed";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();

  if (!profile) {
    const localPart = data.user.email?.split("@")[0] ?? "";
    const baseUsername = localPart.toLowerCase().replace(/[^a-z0-9_]/g, "") || `user${data.user.id.slice(0, 8)}`;

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      username: baseUsername,
      display_name: localPart || "Новый пользователь",
    });

    if (profileError?.code === "23505") {
      // Username taken — fall back to a guaranteed-unique id-based one.
      await supabase.from("profiles").insert({
        id: data.user.id,
        username: `user${data.user.id.slice(0, 8)}`,
        display_name: localPart || "Новый пользователь",
      });
    }

    await supabase.from("user_roles").upsert({ user_id: data.user.id, role: "simple" }, { onConflict: "user_id,role", ignoreDuplicates: true });
    notifyAdmin(`👤 Новая регистрация (email): ${baseUsername}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
