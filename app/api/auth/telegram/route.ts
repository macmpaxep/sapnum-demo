import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Verifies the payload from the Telegram Login Widget
// (https://core.telegram.org/widgets/login#checking-authorization) and
// provisions/logs in the matching Supabase user.
interface TelegramAuthPayload {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

function verifyTelegramAuth(payload: TelegramAuthPayload, botToken: string) {
  const { hash, ...rest } = payload;

  const dataCheckString = Object.entries(rest)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = createHash("sha256").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  // Telegram auth payloads expire after a day to prevent replay attacks.
  const isFresh = Date.now() / 1000 - payload.auth_date < 86400;
  return isFresh;
}

export async function POST(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "Telegram-авторизация не настроена" }, { status: 500 });
  }

  let payload: TelegramAuthPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  if (!payload?.hash || !payload?.id || !payload?.auth_date) {
    return NextResponse.json({ error: "Некорректные данные Telegram" }, { status: 400 });
  }

  if (!verifyTelegramAuth(payload, botToken)) {
    return NextResponse.json({ error: "Подпись Telegram не прошла проверку" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase не настроен" }, { status: 500 });
  }

  // Telegram accounts don't have email — use a synthetic, stable address
  // as the Supabase Auth identity key, keyed by telegram_id.
  const syntheticEmail = `tg-${payload.id}@telegram.sapnum.local`;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("telegram_id", payload.id)
    .maybeSingle();

  let userId = existingProfile?.id as string | undefined;

  if (!userId) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: syntheticEmail,
      email_confirm: true,
      user_metadata: {
        provider: "telegram",
        telegram_id: payload.id,
        telegram_username: payload.username,
      },
    });
    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message ?? "Не удалось создать пользователя" }, { status: 500 });
    }
    userId = created.user.id;

    const baseUsername = payload.username ?? `user${payload.id}`;
    await supabase.from("profiles").insert({
      id: userId,
      username: baseUsername,
      display_name: [payload.first_name, payload.last_name].filter(Boolean).join(" "),
      avatar_url: payload.photo_url,
      telegram_id: payload.id,
      telegram_username: payload.username,
    });
    await supabase.from("user_roles").insert({ user_id: userId, role: "simple" });
  }

  // Issue a one-time magic link and hand its token back to the client,
  // which exchanges it for a session via supabase-js verifyOtp.
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: syntheticEmail,
  });

  if (linkError || !linkData) {
    return NextResponse.json({ error: linkError?.message ?? "Не удалось создать сессию" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    email: syntheticEmail,
    tokenHash: linkData.properties.hashed_token,
  });
}
