// Scrapes the public ARTDEC catalog (art-dec.kz) into the importer's JSON format.
// Usage: node scripts/scrape-artdec.mjs [--limit N]   -> scripts/data/artdec.json
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "https://art-dec.kz";
const CATEGORIES = [
  ["panels", "Декоративные панели"],
  ["moldings", "Молдинги"],
  ["baseboards", "Плинтуса"],
  ["fillets", "Галтели"],
  ["cornices", "Карнизы"],
  ["underlay", "Подложка под ламинат"],
];
const SPEC_LABELS = ["Модель", "Размер", "Толщина", "Материал", "Цвет", "Плотность", "Срок службы"];
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

async function get(path) {
  const res = await fetch(BASE + path, { headers: { "User-Agent": "SAPNUM-importer (partner-approved catalog import)" } });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.text();
}

function toLines(html) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "")
    .replace(/<\/?(br|p|div|li|h\d|dt|dd|tr|td|th|span|section|button|a)[^>]*>/g, "\n");
  return decode(cleaned.replace(/<[^>]+>/g, ""))
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseProduct(html, slug, category) {
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]))
    .find((j) => j["@type"] === "Product");
  if (!ld) throw new Error(`no Product JSON-LD for ${slug}`);

  const lines = toLines(html);
  const start = lines.findIndex((l) => l.toLowerCase() === "характеристики");
  const end = lines.findIndex((l, i) => i > start && l === "Цена");
  const block = lines.slice(start + 1, end === -1 ? undefined : end);

  const specs = [];
  for (let i = 0; i < block.length; i++) {
    const label = SPEC_LABELS.find((l) => block[i] === l || (l === "Размер" && block[i].startsWith("Размер")));
    if (!label || i + 1 >= block.length) continue;
    let value = block[i + 1];
    // The "Размер" label is followed by a hint line ("длина × ширина × толщина") on most pages.
    if (/длина\s*×\s*ширина/i.test(value) && block[i + 2]) value = block[i + 2];
    if (SPEC_LABELS.includes(value)) continue;
    specs.push({ label, value });
  }

  const titleIdx = lines.findIndex((l) => l === "Весь каталог");
  // After "Весь каталог": category label, then the product title, then an intro sentence.
  const titleLine = titleIdx > -1 ? lines[titleIdx + 2] : "";
  const intro = titleIdx > -1 ? lines[titleIdx + 3] : "";
  const mountIdx = lines.findIndex((l) => l === "Монтаж и покраска");
  const mounting = mountIdx > -1 ? lines[mountIdx + 1] : "";

  const isUnderlay = category === "underlay";
  const name = isUnderlay ? titleLine : ld.description || ld.name;
  const description = [isUnderlay ? intro : ld.description, mounting].filter(Boolean).join("\n\n");

  return {
    slug,
    sku: ld.sku,
    name,
    description,
    specs,
    images: (ld.image ?? []).map((u) => (u.startsWith("http") ? u : BASE + u)),
  };
}

const items = [];
for (const [catSlug, catName] of CATEGORIES) {
  const html = await get(`/catalog/${catSlug}`);
  const slugs = [...new Set([...html.matchAll(/\/product\/([a-z0-9_-]+)/g)].map((m) => m[1]))];
  console.log(`${catName}: ${slugs.length} моделей`);
  for (const slug of slugs) {
    if (items.length >= LIMIT) break;
    try {
      const p = parseProduct(await get(`/product/${slug}`), slug, catSlug);
      items.push({ ...p, category: catName, type: "product", priceOnRequest: true, currency: "KZT" });
    } catch (err) {
      console.error("  skip", slug, String(err));
    }
    await sleep(150);
  }
}

const problems = items.filter((i) => i.specs.length < 2 || i.images.length === 0);
console.log(`\nИтого: ${items.length}; без 2+ характеристик или фото: ${problems.length}`);
problems.slice(0, 10).forEach((i) => console.log("  !", i.slug, i.specs.length, "specs,", i.images.length, "img"));

mkdirSync(new URL("./data/", import.meta.url), { recursive: true });
writeFileSync(
  new URL("./data/artdec.json", import.meta.url),
  JSON.stringify(
    {
      company: {
        name: "ARTDEC",
        legalName: 'ТОО «Art Dec»',
        industry: "Производство полимерного декора",
        website: "https://art-dec.kz",
        description:
          "Завод полимерного декора в Каскелене (Алматинская область). С 2020 года производим молдинги, плинтуса, декоративные панели, галтели, карнизы и подложку под ламинат из полистирола и дюрополимера. Собственное производство, склад при заводе, доставка по Алматы и регионам.\n\nКонтакт для связи: +7 707 580 5152",
      },
      owner: { email: "magcanit+artdec@gmail.com", displayName: "ARTDEC", username: "artdec" },
      items,
    },
    null,
    2
  )
);
console.log("Сохранено: scripts/data/artdec.json");
