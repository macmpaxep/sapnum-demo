import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CatalogItem {
  id: string;
  type: "product" | "service";
  name: string;
  priceText: string | null;
  priceOnRequest: boolean;
  description: string | null;
  imageUrl: string | null;
  images: string[];
  companyId: string;
  companyName: string;
  companySlug: string;
  companyOwnerId: string;
}

const ITEM_SELECT =
  "id, type, name, price_text, price_on_request, description, image_url, images, company_id, companies(name, slug, owner_id)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(i: any): CatalogItem {
  const company = i.companies as { name: string; slug: string; owner_id: string } | null;
  return {
    id: i.id,
    type: i.type,
    name: i.name,
    priceText: i.price_text,
    priceOnRequest: i.price_on_request ?? false,
    description: i.description,
    imageUrl: i.image_url,
    images: i.images ?? [],
    companyId: i.company_id,
    companyName: company?.name ?? "",
    companySlug: company?.slug ?? "",
    companyOwnerId: company?.owner_id ?? "",
  };
}

export async function getCompanyCatalog(companyId: string): Promise<CatalogItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("catalog_items")
    .select(ITEM_SELECT)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapRow);
}

export async function listCatalog(filters?: { search?: string; type?: "product" | "service" }): Promise<CatalogItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("catalog_items").select(ITEM_SELECT).order("created_at", { ascending: false }).limit(60);

  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.search?.trim()) query = query.ilike("name", `%${filters.search.trim()}%`);

  const { data } = await query;
  return (data ?? []).map(mapRow);
}

export async function getCatalogItemById(id: string): Promise<CatalogItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("catalog_items").select(ITEM_SELECT).eq("id", id).maybeSingle();
  return data ? mapRow(data) : null;
}

export async function getRelatedCatalogItems(item: CatalogItem, limit = 4): Promise<CatalogItem[]> {
  const supabase = await createSupabaseServerClient();

  const { data: sameCompany } = await supabase
    .from("catalog_items")
    .select(ITEM_SELECT)
    .eq("company_id", item.companyId)
    .neq("id", item.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  const results = (sameCompany ?? []).map(mapRow);
  if (results.length >= limit) return results;

  const { data: sameType } = await supabase
    .from("catalog_items")
    .select(ITEM_SELECT)
    .eq("type", item.type)
    .neq("id", item.id)
    .neq("company_id", item.companyId)
    .order("created_at", { ascending: false })
    .limit(limit - results.length);

  return [...results, ...(sameType ?? []).map(mapRow)];
}
