import Link from "next/link";
import ProfileSidebarData from "@/components/demo/ProfileSidebarData";
import AiPanel from "@/components/demo/AiPanel";
import Chat from "@/components/demo/Chat";
import SearchBox from "@/components/people/SearchBox";
import { listCatalog } from "@/lib/catalog";
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
      <div className="lg:col-start-1">
        <ProfileSidebarData />
      </div>

      <main className="min-w-0 space-y-4">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Каталог</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Товары и услуги компаний сообщества SAPNUM.</p>

        {companySlug ? (
          <Link
            href={`/co/${companySlug}?add=1`}
            className="flex items-center justify-between border border-neutral-900 bg-neutral-900 px-4 py-3 text-sm text-white hover:bg-neutral-800"
          >
            <span>Разместите свои товары и услуги в каталоге</span>
            <span>+ Добавить</span>
          </Link>
        ) : (
          <Link
            href="/co/new"
            className="flex items-center justify-between border border-dashed border-neutral-300 dark:border-neutral-700 px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-neutral-900 dark:hover:text-white"
          >
            <span>Хотите разместить здесь свои товары или услуги?</span>
            <span>Создать страницу компании →</span>
          </Link>
        )}

        <SearchBox placeholder="Поиск товаров и услуг…" />

        <div className="flex gap-2 text-xs">
          <Link href="/catalog" className={`border px-2.5 py-1 ${!type ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"}`}>
            Все
          </Link>
          <Link href="/catalog?type=product" className={`border px-2.5 py-1 ${type === "product" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"}`}>
            Товары
          </Link>
          <Link href="/catalog?type=service" className={`border px-2.5 py-1 ${type === "service" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"}`}>
            Услуги
          </Link>
        </div>

        {items.length === 0 && (
          <p className="border border-dashed border-neutral-300 dark:border-neutral-700 p-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
            Пока ничего нет. Добавить можно со страницы вашей компании.
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/item/${item.id}`}
              className="group border border-neutral-200 dark:border-neutral-800 transition-shadow hover:shadow-md"
            >
              <div className="aspect-square w-full overflow-hidden bg-neutral-50 dark:bg-neutral-900">
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
                <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">{item.name}</div>
                <div className="text-sm text-neutral-900 dark:text-neutral-50">
                  {item.priceOnRequest ? <span className="text-neutral-500 dark:text-neutral-400">Цена по запросу</span> : item.priceText || ""}
                </div>
                <div className="truncate text-xs text-neutral-400 dark:text-neutral-500">{item.companyName}</div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <div className="flex flex-col gap-6 min-w-0">
        <AiPanel />
        <Chat />
      </div>
    </div>
  );
}
