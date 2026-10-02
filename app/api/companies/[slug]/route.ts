import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moderateText } from "@/lib/moderation";
import { sanitizeContacts } from "@/lib/companyContacts";

// Accepts "site.kz" or "https://site.kz"; anything that isn't http(s) is rejected
// because the value is rendered as a clickable href.
function normalizeWebsite(raw: string): string | null | undefined {
  const v = raw.trim();
  if (!v) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    if (!url.hostname.includes(".")) return undefined;
    return url.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  let body: {
    name?: string;
    industry?: string;
    description?: string;
    website?: string;
    bin?: string;
    contacts?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const { data: company } = await supabase.from("companies").select("id, owner_id").eq("slug", slug).maybeSingle();
  if (!company) return NextResponse.json({ error: "Компания не найдена" }, { status: 404 });

  let allowed = company.owner_id === user.id;
  if (!allowed) {
    const { data: membership } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", company.id)
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .maybeSingle();
    allowed = Boolean(membership);
  }
  if (!allowed) return NextResponse.json({ error: "Редактировать компанию может только владелец" }, { status: 403 });

  const update: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Укажите название компании" }, { status: 400 });
    if (name.length > 100) return NextResponse.json({ error: "Название не длиннее 100 символов" }, { status: 400 });
    update.name = name;
  }
  if (body.industry !== undefined) update.industry = body.industry.trim().slice(0, 100) || null;
  if (body.description !== undefined) update.description = body.description.trim().slice(0, 2000) || null;

  if (body.website !== undefined) {
    const website = normalizeWebsite(body.website);
    if (website === undefined) return NextResponse.json({ error: "Некорректная ссылка на сайт" }, { status: 400 });
    update.website = website;
  }

  if (body.bin !== undefined) {
    const bin = body.bin.replace(/\s/g, "");
    if (bin && !/^\d{12}$/.test(bin)) {
      return NextResponse.json({ error: "БИН/ИИН состоит из 12 цифр" }, { status: 400 });
    }
    update.bin = bin || null;
  }

  if (body.contacts !== undefined) {
    const contacts = sanitizeContacts(body.contacts);
    if (!contacts) return NextResponse.json({ error: "Некорректные контакты (максимум 10, до 120 символов каждый)" }, { status: 400 });
    update.contacts = contacts;
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true });

  const textCheck = await moderateText(`${update.name ?? ""} ${update.description ?? ""}`.trim() || " ");
  if (!textCheck.allowed) {
    return NextResponse.json({ error: textCheck.reason ?? "Текст не прошёл модерацию" }, { status: 422 });
  }

  const { error } = await supabase.from("companies").update(update).eq("id", company.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
