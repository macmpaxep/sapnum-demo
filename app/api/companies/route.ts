import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/telegramNotify";

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
};

// Slugs under /co/{slug} that would otherwise collide with app routes.
const RESERVED_SLUGS = new Set(["new", "api", "login", "feed", "catalog", "people", "companies", "messages", "settings", "profile"]);

function slugify(name: string): string {
  const transliterated = name
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("");
  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "company";
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { data: existing } = await supabase.from("companies").select("slug").eq("owner_id", user.id).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "У вас уже есть компания", slug: existing.slug }, { status: 409 });
  }

  let body: { name?: string; industry?: string; description?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Укажите название компании" }, { status: 400 });

  const baseSlug = slugify(name);
  let slug = RESERVED_SLUGS.has(baseSlug) ? `${baseSlug}-${Math.floor(Math.random() * 10000)}` : baseSlug;
  for (let i = 0; i < 20; i++) {
    const { data: taken } = await supabase.from("companies").select("id").eq("slug", slug).maybeSingle();
    if (!taken && !RESERVED_SLUGS.has(slug)) break;
    slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
  }

  const { data: company, error } = await supabase
    .from("companies")
    .insert({
      owner_id: user.id,
      slug,
      name,
      industry: body.industry?.trim() || null,
      description: body.description?.trim() || null,
      website: body.website?.trim() || null,
    })
    .select("id, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from("company_members").insert({ company_id: company.id, user_id: user.id, role: "owner" });
  // Ignore conflict — the user may already have the "business" role.
  await supabase.from("user_roles").upsert({ user_id: user.id, role: "business" }, { onConflict: "user_id,role" });
  notifyAdmin(`🏢 Новая компания: ${name} (/co/${company.slug})`);

  return NextResponse.json({ slug: company.slug });
}
