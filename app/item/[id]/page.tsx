import Link from "next/link";
import { notFound } from "next/navigation";
import BackButton from "@/components/demo/BackButton";
import ItemDetail from "@/components/company/ItemDetail";
import { getCatalogItemById, getRelatedCatalogItems, formatCatalogPrice } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, user] = await Promise.all([getCatalogItemById(id), getCurrentUser()]);
  if (!item) notFound();

  const related = await getRelatedCatalogItems(item);

  const supabase = getSupabaseAdmin();
  supabase?.rpc("increment_catalog_view", { c_id: id }).then(
    () => {},
    () => {}
  );

  const canManage = user?.id === item.companyOwnerId;

  return (
    <div className="space-y-8">
      <BackButton />
      <nav className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
        <Link href="/catalog" className="hover:text-neutral-900 dark:hover:text-paper hover:underline">
          Каталог
        </Link>
        <span>/</span>
        <Link href={`/co/${item.companySlug}`} className="hover:text-neutral-900 dark:hover:text-paper hover:underline">
          {item.companyName}
        </Link>
        <span>/</span>
        <span className="text-neutral-600 dark:text-neutral-300">{item.name}</span>
      </nav>

      <ItemDetail item={item} canManage={canManage} />

      {related.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-neutral-900 dark:text-paper">Похожие товары и услуги</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/item/${r.id}`}
                className="group overflow-hidden rounded-lg border border-neutral-200 dark:border-line transition-shadow hover:shadow-md"
              >
                <div className="aspect-square w-full overflow-hidden bg-neutral-50 dark:bg-panel">
                  {r.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>
                <div className="space-y-0.5 p-2.5">
                  <div className="truncate text-sm font-medium text-neutral-900 dark:text-paper">{r.name}</div>
                  {(r.priceOnRequest || r.priceText) && (
                    <div className={`text-sm font-medium ${r.priceOnRequest ? "text-neutral-500 dark:text-neutral-400" : "text-emerald-600 dark:text-gain"}`}>
                      {formatCatalogPrice(r)}
                    </div>
                  )}
                  <div className="truncate text-xs text-neutral-400 dark:text-neutral-500">{r.companyName}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
