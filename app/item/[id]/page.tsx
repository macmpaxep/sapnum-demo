import Link from "next/link";
import { notFound } from "next/navigation";
import ItemDetail from "@/components/company/ItemDetail";
import { getCatalogItemById } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, user] = await Promise.all([getCatalogItemById(id), getCurrentUser()]);
  if (!item) notFound();

  const supabase = getSupabaseAdmin();
  supabase?.rpc("increment_catalog_view", { c_id: id }).then(
    () => {},
    () => {}
  );

  const canManage = user?.id === item.companyOwnerId;

  return (
    <div className="space-y-4">
      <Link href="/catalog" className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        ← В каталог
      </Link>
      <ItemDetail item={item} canManage={canManage} />
    </div>
  );
}
