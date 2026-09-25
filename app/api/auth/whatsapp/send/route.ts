import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppOtp, normalizePhone } from "@/lib/whatsappAuth";

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase не настроен" }, { status: 500 });
  }

  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  if (!phone) {
    return NextResponse.json({ error: "Введите номер телефона в международном формате" }, { status: 400 });
  }

  const { data: recent } = await supabase
    .from("whatsapp_otp_codes")
    .select("created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent && Date.now() - new Date(recent.created_at).getTime() < RESEND_COOLDOWN_MS) {
    return NextResponse.json({ error: "Подождите минуту перед повторной отправкой кода" }, { status: 429 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));

  try {
    await sendWhatsAppOtp(phone, code);
  } catch (err) {
    console.error("[whatsapp-auth] send failed", { phone, error: err instanceof Error ? err.message : err });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Не удалось отправить код" }, { status: 502 });
  }

  const { error: insertError } = await supabase.from("whatsapp_otp_codes").insert({
    phone,
    code_hash: hashCode(code),
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
