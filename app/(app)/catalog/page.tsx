import Link from "next/link";
import AiPanel from "@/components/demo/AiPanel";
import SearchBox from "@/components/people/SearchBox";
import { listCatalog, formatCatalogPrice } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { getCompanySlugForUser } from "@/lib/companies";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: "product" | "service" }>;
}) {
  const { q, type } = await searchParams;
  const [items, user] = await Promise.all([listCatalog({ search: q, type }), getCurrentUser()]);
  const companySlug = user ? await getCompanySlugForUser(user.id) : null;

  return (
    <div className="space-y-4">
      {/* Липкая шапка каталога: заголовок, поиск, фильтры, ИИ-ассистент —
          остаются видимыми при прокрутке. Без "bleed"-трюка с отрицательными
          отступами — держится в пределах обычного контентного отступа
          страницы, чтобы не задевать позиционирование хедера сайта. */}
      <div className="sticky top-14 z-10 space-y-3 rounded-lg border border-neutral-200 dark:border-line bg-white/95 dark:bg-ink/95 p-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-paper">Каталог</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Товары и услуги компаний сообщества SAPNUM.</p>
          </div>
          {companySlug ? (
            <Link
              href={`/co/${companySlug}?add=1`}
              className="shrink-0 rounded-lg border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-3 py-1.5 text-xs text-white dark:text-ink hover:bg-neutral-800 dark:hover:bg-neutral-100"
            >
              + Добавить товар
            </Link>
          ) : (
            <Link
              href="/co/new"
              className="shrink-0 rounded-lg border border-dashed border-neutral-300 dark:border-line px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-mute hover:text-neutral-900 dark:hover:text-paper"
            >
              Создать страницу компании →
            </Link>
          )}
        </div>

        <SearchBox placeholder="Поиск товаров и услуг…" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 text-xs">
            <Link
              href="/catalog"
              className={`rounded-lg border px-2.5 py-1 ${!type ? "border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper text-white dark:text-ink" : "border-neutral-300 dark:border-line text-neutral-600 dark:text-neutral-400"}`}
            >
              Все
            </Link>
            <Link
              href="/catalog?type=product"
              className={`rounded-lg border px-2.5 py-1 ${type === "product" ? "border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper text-white dark:text-ink" : "border-neutral-300 dark:border-line text-neutral-600 dark:text-neutral-400"}`}
            >
              Товары
            </Link>
            <Link
              href="/catalog?type=service"
              className={`rounded-lg border px-2.5 py-1 ${type === "service" ? "border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper text-white dark:text-ink" : "border-neutral-300 dark:border-line text-neutral-600 dark:text-neutral-400"}`}
            >
              Услуги
            </Link>
          </div>
        </div>

        <AiPanel compact />
      </div>

      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-neutral-300 dark:border-line p-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
          Пока ничего нет. Добавить можно со страницы вашей компании.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/item/${item.id}`}
            className="group overflow-hidden rounded-lg border border-neutral-200 dark:border-line transition-shadow hover:shadow-md"
          >
            <div className="aspect-square w-full overflow-hidden bg-neutral-50 dark:bg-panel">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full" />
              )}
            </div>
            <div className="space-y-0.5 p-2.5">
              <div className="truncate text-sm font-medium text-neutral-900 dark:text-paper">{item.name}</div>
              {(item.priceOnRequest || item.priceText) && (
                <div className={`text-sm font-medium ${item.priceOnRequest ? "text-neutral-500 dark:text-neutral-400" : "text-emerald-600 dark:text-gain"}`}>
                  {formatCatalogPrice(item)}
                </div>
              )}
              <div className="truncate text-xs text-neutral-400 dark:text-neutral-500">{item.companyName}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
