import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCompanyBySlug, getCompanySlugForUser } from "@/lib/companies";
import { parseDashboardFile, DashboardParseError } from "@/lib/dashboardParse";

const SYSTEM_PROMPT = `Ты — ИИ-аналитик платформы SAPNUM. Тебе дают агрегированные показатели продаж
компании, посчитанные из загруженного файла. Напиши краткий обзор на русском языке (3-5 предложений):
что растёт, что падает, и одну конкретную рекомендацию предпринимателю. Пиши по существу, без вступлений
вроде "Вот анализ". Обычным текстом без markdown-разметки — без **, без списков через дефис, без заголовков.
Если данных мало (например, только один месяц), честно скажи, что для выводов о динамике нужно больше данных.`;

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const slug = await getCompanySlugForUser(user.id);
  if (!slug) return NextResponse.json({ error: "У вас нет компании" }, { status: 403 });
  const company = await getCompanyBySlug(slug);
  if (!company || !company.isOwnerOrAdmin) {
    return NextResponse.json({ error: "Загружать данные может только владелец компании" }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Файл слишком большой (макс. 10 МБ)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let summary;
  try {
    summary = parseDashboardFile(buffer);
  } catch (err) {
    if (err instanceof DashboardParseError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json({ error: "Не удалось обработать файл" }, { status: 422 });
  }

  let aiOverview: string | null = null;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const anthropic = new Anthropic({ apiKey });
      const context = [
        `Всего строк: ${summary.rowCount}`,
        `Общая выручка: ${summary.totalRevenue}`,
        `Средний чек: ${summary.averageCheck}`,
        summary.growthPct !== null ? `Рост к предыдущему месяцу: ${summary.growthPct}%` : "Недостаточно месяцев для расчёта динамики",
        "Выручка по месяцам: " + summary.monthlySeries.map((m) => `${m.month}: ${m.revenue}`).join(", "),
        "Топ товары/услуги по выручке: " + summary.topProducts.map((p) => `${p.name}: ${p.revenue}`).join(", "),
      ].join("\n");

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: context }],
      });
      aiOverview = response.content.find((b) => b.type === "text")?.text ?? null;
    } catch (err) {
      console.error("[dashboard-upload] AI overview failed", err);
    }
  }

  const { error } = await supabase.from("company_dashboards").upsert({
    company_id: company.id,
    uploaded_by: user.id,
    source_filename: file.name,
    row_count: summary.rowCount,
    summary,
    ai_overview: aiOverview,
    uploaded_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, summary, aiOverview });
}
