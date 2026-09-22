import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VALID_TYPES = ["partnership", "distributor", "commercial_offer", "investment"];

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  let body: { companyId?: string; type?: string; message?: string; amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const { companyId, type, message } = body;
  if (!companyId || !type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Укажите компанию и тип заявки" }, { status: 400 });
  }
  if (!message?.trim()) {
    return NextResponse.json({ error: "Опишите вашу заявку" }, { status: 400 });
  }

  if (type === "investment") {
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const isInvestor = (roles ?? []).some((r) => r.role === "investor");
    if (!isInvestor) {
      return NextResponse.json({ error: "Заявки на инвестиции доступны только пользователям с ролью «Инвестор»" }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      applicant_id: user.id,
      target_company_id: companyId,
      type,
      message: message.trim(),
      requested_amount: type === "investment" ? body.amount ?? null : null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ application: data });
}
