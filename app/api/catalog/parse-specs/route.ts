import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `Ты помогаешь продавцам на платформе SAPNUM переносить характеристики товара/услуги
из произвольного текста (часто скопированного с другого сайта, со списками, маркерами, двоеточиями)
в структурированный список "параметр: значение".
Правила:
- Верни ТОЛЬКО валидный JSON-массив объектов вида {"label": "...", "value": "..."}, без markdown, без пояснений.
- label — короткое название параметра (без двоеточия и без единиц измерения, если они не часть названия).
- value — значение параметра как есть, вместе с единицами измерения, если они были.
- Не выдумывай характеристики, которых нет в тексте.
- Не включай в список общие фразы вроде "Дополнительные характеристики" — только сами параметры.
- Максимум 20 характеристик.`;

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
    return NextResponse.json({ error: "Вставьте текст с характеристиками" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    await supabase.from("assistant_usage").insert({ user_id: user.id });

    const raw = response.content.find((b) => b.type === "text")?.text?.trim() ?? "[]";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

    const specs = Array.isArray(parsed)
      ? parsed
          .filter((s) => s && typeof s.label === "string" && typeof s.value === "string" && s.label.trim() && s.value.trim())
          .slice(0, 20)
          .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
      : [];

    if (specs.length === 0) {
      return NextResponse.json({ error: "Не удалось распознать характеристики в этом тексте" }, { status: 422 });
    }

    return NextResponse.json({ specs });
  } catch (err) {
    console.error("[parse-specs]", err);
    return NextResponse.json({ error: "Не удалось распознать характеристики, попробуйте позже" }, { status: 502 });
  }
}
