// Imports a supplier (account + company + catalog + optional "collection" feed posts)
// from a JSON file produced by a scraper such as scripts/scrape-artdec.mjs.
//
//   node scripts/import-supplier.mjs scripts/data/artdec.json --dry-run
//   node scripts/import-supplier.mjs scripts/data/artdec.json --limit 5
//   node scripts/import-supplier.mjs scripts/data/artdec.json --collection "Молдинги"
//
// Re-runnable: existing company/items/collection posts are detected and skipped.
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (read from .env.local).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

try {
  process.loadEnvFile(fileURLToPath(new URL("../.env.local", import.meta.url)));
} catch {
  /* env may already be set */
}
const { createClient } = await import("@supabase/supabase-js");

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--limit" && args[args.indexOf(a) - 1] !== "--sample" && args[args.indexOf(a) - 1] !== "--collection");
const DRY = args.includes("--dry-run");
const li = args.indexOf("--limit");
const LIMIT = li > -1 ? Number(args[li + 1]) : Infinity;
const si = args.indexOf("--sample");
const SAMPLE = si > -1 ? Number(args[si + 1]) : Infinity; // first N items per category
const collections = args.flatMap((a, i) => (a === "--collection" ? [args[i + 1]] : []));
if (!file) throw new Error("usage: import-supplier.mjs <data.json> [--dry-run] [--limit N] [--collection <category>]...");

const data = JSON.parse(readFileSync(file, "utf8"));
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const log = (...m) => console.log(DRY ? "[dry]" : "", ...m);

const TRANSLIT = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ы: "y", э: "e", ю: "yu", я: "ya" };
const slugify = (s) =>
  s.toLowerCase().split("").map((c) => TRANSLIT[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "company";

// ---- owner + company ----
const slug = slugify(data.company.name);
let { data: company } = await supabase.from("companies").select("id, owner_id, slug").eq("slug", slug).maybeSingle();
let ownerId = company?.owner_id;

if (!company) {
  log(`create owner ${data.owner.email} and company "${data.company.name}" (/co/${slug})`);
  if (!DRY) {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: data.owner.email,
      email_confirm: true,
      user_metadata: { provider: "partner-import" },
    });
    if (error) throw error;
    ownerId = created.user.id;
    let username = data.owner.username;
    const { data: taken } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (taken) username = `${username}${Math.floor(Math.random() * 1000)}`;
    const { error: pErr } = await supabase.from("profiles").insert({ id: ownerId, username, display_name: data.owner.displayName });
    if (pErr) throw pErr;
    await supabase.from("user_roles").upsert([{ user_id: ownerId, role: "simple" }, { user_id: ownerId, role: "business" }], { onConflict: "user_id,role", ignoreDuplicates: true });
    const { data: c, error: cErr } = await supabase
      .from("companies")
      .insert({ owner_id: ownerId, slug, name: data.company.name, industry: data.company.industry, description: data.company.description, website: data.company.website })
      .select("id, owner_id, slug")
      .single();
    if (cErr) throw cErr;
    company = c;
    await supabase.from("company_members").insert({ company_id: company.id, user_id: ownerId, role: "owner" });
  }
} else {
  log(`company /co/${slug} exists, reusing`);
}

// ---- items ----
const { data: existing } = company
  ? await supabase.from("catalog_items").select("name").eq("company_id", company.id)
  : { data: [] };
const have = new Set((existing ?? []).map((i) => i.name));

async function uploadImage(url, key) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const type = res.headers.get("content-type") ?? "image/webp";
  const path = `${ownerId}/import/${slug}/${key}`;
  const { error } = await supabase.storage.from("post-media").upload(path, buf, { contentType: type, upsert: true });
  if (error) throw error;
  return supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
}

let created = 0;
let skipped = 0;
const perCategory = new Map();
const selected = data.items.filter((i) => {
  const n = (perCategory.get(i.category) ?? 0) + 1;
  perCategory.set(i.category, n);
  return n <= SAMPLE;
});
for (const item of selected.slice(0, LIMIT)) {
  if (have.has(item.name)) {
    skipped++;
    continue;
  }
  log(`item [${item.category}] ${item.name} — ${item.specs.length} specs, ${item.images.length} photos`);
  if (DRY) {
    created++;
    continue;
  }
  const urls = [];
  for (let i = 0; i < item.images.length; i++) {
    const ext = item.images[i].split(".").pop().split("?")[0] || "webp";
    urls.push(await uploadImage(item.images[i], `${item.slug}-${i + 1}.${ext}`));
  }
  const { error } = await supabase.from("catalog_items").insert({
    company_id: company.id,
    type: item.type ?? "product",
    name: item.name,
    price_text: item.priceOnRequest ? null : item.priceText ?? null,
    price_on_request: Boolean(item.priceOnRequest),
    currency: item.currency ?? "KZT",
    description: item.description || null,
    image_url: urls[0] ?? null,
    images: urls,
    specs: item.specs,
    category: item.category ?? null,
  });
  if (error) throw new Error(`${item.name}: ${error.message}`);
  created++;
}
log(`items: ${created} new, ${skipped} already present`);

// ---- collection posts (one per category, only those requested) ----
for (const category of collections) {
  const total = data.items.filter((i) => i.category === category).length;
  if (total === 0) {
    console.warn(`no items in category "${category}"`);
    continue;
  }
  const { data: dup } = company
    ? await supabase.from("posts").select("id").eq("company_id", company.id).eq("collection_category", category).maybeSingle()
    : { data: null };
  if (dup) {
    log(`collection "${category}" already posted`);
    continue;
  }
  log(`collection post "${category}" (${total} models)`);
  if (DRY) continue;
  const { error } = await supabase.from("posts").insert({
    author_id: ownerId,
    company_id: company.id,
    collection_category: category,
    topic: "Товары",
    body: `${data.company.name} · ${category}: ${total} ${total % 10 === 1 && total % 100 !== 11 ? "модель" : "моделей"} в каталоге`,
    media_urls: [],
  });
  if (error) throw error;
}
console.log("done");
