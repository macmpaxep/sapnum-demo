import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { overviewStats, comparisonMetrics } from "@/lib/demo-data";

const SYSTEM_PROMPT = `Ты — ИИ-аналитик платформы SAPNUM для предпринимателей. Отвечай кратко (2-4 предложения),
по делу, на русском языке. Ты видишь только показатели, которые тебе передают в контексте — если данных
не хватает, честно скажи об этом, не выдумывай цифры.`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ИИ-ассистент пока не настроен (нет ANTHROPIC_API_KEY)" }, { status: 500 });
  }

  let body: { question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "Введите вопрос" }, { status: 400 });
  }

  const context = [
    "Текущие показатели компании за месяц:",
    ...overviewStats.map((s) => `- ${s.label}: ${s.value}${s.unit}`),
    "Сравнение с конкурентами:",
    ...comparisonMetrics.map((m) => `- ${m.label}: вы ${m.mine}, конкуренты ${m.competitors}`),
  ].join("\n");

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Контекст:\n${context}\n\nВопрос: ${question}` }],
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "Не удалось получить ответ.";
    return NextResponse.json({ answer: text });
  } catch (err) {
    console.error("[assistant]", err);
    return NextResponse.json({ error: "Ассистент временно недоступен" }, { status: 502 });
  }
}
