import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notifyAdmin } from "@/lib/telegramNotify";
import { normalizePhone } from "@/lib/whatsappAuth";

const MAX_ATTEMPTS = 5;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase не настроен" }, { status: 500 });
  }
  const supabase = supabaseAdmin;

  let body: { phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  const code = body.code?.trim();
  if (!phone || !code) {
    return NextResponse.json({ error: "Введите номер и код" }, { status: 400 });
  }

  const { data: otp } = await supabase
    .from("whatsapp_otp_codes")
    .select("id, code_hash, attempts, expires_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otp) {
    return NextResponse.json({ error: "Сначала запросите код" }, { status: 400 });
  }
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Код истёк, запросите новый" }, { status: 400 });
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Слишком много попыток, запросите новый код" }, { status: 429 });
  }
  if (otp.code_hash !== hashCode(code)) {
    await supabase.from("whatsapp_otp_codes").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
    return NextResponse.json({ error: "Неверный код" }, { status: 401 });
  }

  await supabase.from("whatsapp_otp_codes").delete().eq("id", otp.id);

  // WhatsApp accounts don't have email — same synthetic-address pattern as
  // Telegram login, keyed by phone instead of telegram_id.
  const syntheticEmail = `wa-${phone.replace("+", "")}@whatsapp.sapnum.local`;

  const { data: existingProfile } = await supabase.from("profiles").select("id").eq("whatsapp_phone", phone).maybeSingle();
  let userId = existingProfile?.id as string | undefined;

  if (!userId) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: syntheticEmail,
      email_confirm: true,
      user_metadata: { provider: "whatsapp", whatsapp_phone: phone },
    });
    userId = created?.user?.id;
    if (createError && !/already|registered|exists/i.test(createError.message)) {
      const { data: retryProfile } = await supabase.from("profiles").select("id").eq("whatsapp_phone", phone).maybeSingle();
      if (retryProfile) {
        userId = retryProfile.id;
      } else {
        console.error("[whatsapp-auth] createUser failed", { phone, error: createError.message });
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
    }
  }

  async function tryGenerateLink() {
    return supabase.auth.admin.generateLink({ type: "magiclink", email: syntheticEmail });
  }
  let { data: linkData, error: linkError } = await tryGenerateLink();
  if (linkError || !linkData) {
    ({ data: linkData, error: linkError } = await tryGenerateLink());
  }
  if (linkError || !linkData) {
    console.error("[whatsapp-auth] generateLink failed after retry", { phone, error: linkError?.message });
    return NextResponse.json({ error: linkError?.message ?? "Не удалось создать сессию" }, { status: 500 });
  }
  const link = linkData as { user: { id: string }; properties: { hashed_token: string } };

  if (!existingProfile) {
    userId = userId ?? link.user.id;
    const baseUsername = `user${phone.replace(/\D/g, "")}`;
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      username: baseUsername,
      display_name: "Новый пользователь",
      whatsapp_phone: phone,
    });
    if (profileError?.code === "23505") {
      await supabase.from("profiles").insert({
        id: userId,
        username: `${baseUsername}${Date.now().toString().slice(-4)}`,
        display_name: "Новый пользователь",
        whatsapp_phone: phone,
      });
    }
    await supabase.from("user_roles").upsert({ user_id: userId, role: "simple" }, { onConflict: "user_id,role", ignoreDuplicates: true });
    notifyAdmin(`👤 Новая регистрация (WhatsApp): ${phone}`);
  }

  return NextResponse.json({
    ok: true,
    email: syntheticEmail,
    tokenHash: link.properties.hashed_token,
  });
}
