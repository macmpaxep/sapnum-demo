import Link from "next/link";
import ProfileSidebarData from "@/components/demo/ProfileSidebarData";
import AiPanel from "@/components/demo/AiPanel";
import Chat from "@/components/demo/Chat";
import SearchBox from "@/components/people/SearchBox";
import { listCatalog } from "@/lib/catalog";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: "product" | "service" }>;
}) {
  const { q, type } = await searchParams;
  const items = await listCatalog({ search: q, type });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
      <div className="lg:col-start-1">
        <ProfileSidebarData />
      </div>

      <main className="min-w-0 space-y-4">
        <h1 className="text-lg font-semibold text-neutral-900">Каталог</h1>
        <p className="text-sm text-neutral-500">Товары и услуги от компаний, зарегистрированных на SAPNUM.</p>

        <SearchBox placeholder="Поиск товаров и услуг…" />

        <div className="flex gap-2 text-xs">
          <Link href="/catalog" className={`border px-2.5 py-1 ${!type ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-600"}`}>
            Все
          </Link>
          <Link href="/catalog?type=product" className={`border px-2.5 py-1 ${type === "product" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-600"}`}>
            Товары
          </Link>
          <Link href="/catalog?type=service" className={`border px-2.5 py-1 ${type === "service" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-600"}`}>
            Услуги
          </Link>
        </div>

        {items.length === 0 && (
          <p className="border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
            Пока ничего нет. Добавить можно со страницы вашей компании.
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item) => (
            <Link key={item.id} href={`/company/${item.companySlug}`} className="text-center">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="aspect-square w-full border border-neutral-200 object-cover" />
              ) : (
                <div className="aspect-square border border-neutral-200 bg-neutral-50" />
              )}
              <div className="mt-2 text-xs font-medium text-neutral-900">{item.name}</div>
              {item.priceText && <div className="text-xs text-neutral-500">{item.priceText}</div>}
              <div className="text-xs text-neutral-400">{item.companyName}</div>
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
