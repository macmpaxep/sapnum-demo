import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `Ты помогаешь предпринимателям на платформе SAPNUM красиво и профессионально
оформлять тексты — описания товаров/услуг и записи в ленте. Перепиши текст пользователя:
- сохрани смысл и факты, ничего не выдумывай и не добавляй лишнего;
- исправь грамматику, пунктуацию, СПЛОШНОЙ КАПС, лишние пробелы и эмодзи;
- сделай тон деловым, но живым, не канцелярским;
- не удлиняй текст без необходимости — просто сделай его аккуратным;
- ответь только финальным текстом, без markdown, без кавычек, без пояснений от себя.`;

const HOURLY_LIMIT = 20;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ИИ пока не настроен" }, { status: 500 });
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
    return NextResponse.json({ error: `Лимит ${HOURLY_LIMIT} запросов к ИИ в час исчерпан.` }, { status: 429 });
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Нечего улучшать" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    await supabase.from("assistant_usage").insert({ user_id: user.id });

    const improved = response.content.find((b) => b.type === "text")?.text?.trim();
    return NextResponse.json({ improved: improved || text });
  } catch (err) {
    console.error("[improve-text]", err);
    return NextResponse.json({ error: "Не удалось улучшить текст, попробуйте позже" }, { status: 502 });
  }
}
