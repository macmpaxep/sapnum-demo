import * as XLSX from "xlsx";

export interface DashboardSummary {
  totalRevenue: number;
  averageCheck: number;
  growthPct: number | null;
  monthlySeries: { month: string; revenue: number }[];
  topProducts: { name: string; revenue: number }[];
  rowCount: number;
}

const DATE_KEYS = ["дата", "date"];
const PRODUCT_KEYS = ["товар", "услуга", "продукт", "наименование", "product", "item", "name", "название"];
const AMOUNT_KEYS = ["сумма", "выручка", "цена", "стоимость", "amount", "revenue", "price", "total"];

function findKey(row: Record<string, unknown>, candidates: string[]): string | null {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const match = keys.find((k) => k.trim().toLowerCase() === c);
    if (match) return match;
  }
  // fall back to a loose substring match
  for (const c of candidates) {
    const match = keys.find((k) => k.trim().toLowerCase().includes(c));
    if (match) return match;
  }
  return null;
}

function parseAmount(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return 0;
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseDate(raw: unknown): Date | null {
  if (raw instanceof Date) return raw;
  if (typeof raw === "number") {
    // Excel serial date
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (!parsed) return null;
    return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  if (typeof raw === "string") {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

export class DashboardParseError extends Error {}

export function parseDashboardFile(buffer: Buffer): DashboardSummary {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  } catch {
    throw new DashboardParseError("Не удалось прочитать файл — проверьте формат (Excel .xlsx или .csv)");
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  if (rows.length === 0) {
    throw new DashboardParseError("В файле нет строк с данными");
  }

  const dateKey = findKey(rows[0], DATE_KEYS);
  const productKey = findKey(rows[0], PRODUCT_KEYS);
  const amountKey = findKey(rows[0], AMOUNT_KEYS);

  if (!amountKey) {
    throw new DashboardParseError(
      "Не нашли колонку с суммой продажи. Назовите её, например, «Сумма» или «Выручка»."
    );
  }

  const revenueByMonth = new Map<string, number>();
  const revenueByProduct = new Map<string, number>();
  let totalRevenue = 0;

  for (const row of rows) {
    const amount = parseAmount(row[amountKey]);
    if (!amount) continue;
    totalRevenue += amount;

    if (dateKey) {
      const date = parseDate(row[dateKey]);
      if (date) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) ?? 0) + amount);
      }
    }

    if (productKey) {
      const product = String(row[productKey] ?? "").trim() || "Без названия";
      revenueByProduct.set(product, (revenueByProduct.get(product) ?? 0) + amount);
    }
  }

  const monthlySeries = Array.from(revenueByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));

  const topProducts = Array.from(revenueByProduct.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));

  let growthPct: number | null = null;
  if (monthlySeries.length >= 2) {
    const prev = monthlySeries[monthlySeries.length - 2].revenue;
    const last = monthlySeries[monthlySeries.length - 1].revenue;
    if (prev > 0) growthPct = Math.round(((last - prev) / prev) * 100);
  }

  return {
    totalRevenue: Math.round(totalRevenue),
    averageCheck: rows.length ? Math.round(totalRevenue / rows.length) : 0,
    growthPct,
    monthlySeries,
    topProducts,
    rowCount: rows.length,
  };
}
