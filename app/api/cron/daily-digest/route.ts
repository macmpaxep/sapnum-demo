import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notifyAdmin } from "@/lib/telegramNotify";

// Triggered once a day by a system cron job on the VPS (see deploy docs),
// protected by a shared secret rather than auth — nothing here is
// user-facing. Summarizes yesterday's activity into one Telegram message
// instead of pinging on every single page view.
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase не настроен" }, { status: 500 });

  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [views, users, companies, items, applications, conversations, posts] = await Promise.all([
    supabase.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("companies").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("catalog_items").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("applications").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("conversations").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);

  const text = [
    `📊 <b>SAPNUM — сводка за сутки</b>`,
    `👀 Просмотров страниц: ${views.count ?? 0}`,
    `👤 Новых пользователей: ${users.count ?? 0}`,
    `🏢 Новых компаний: ${companies.count ?? 0}`,
    `📦 Новых товаров/услуг: ${items.count ?? 0}`,
    `📝 Новых заявок: ${applications.count ?? 0}`,
    `💬 Новых диалогов: ${conversations.count ?? 0}`,
    `✍️ Новых записей в ленте: ${posts.count ?? 0}`,
  ].join("\n");

  await notifyAdmin(text);

  return NextResponse.json({ ok: true });
}
