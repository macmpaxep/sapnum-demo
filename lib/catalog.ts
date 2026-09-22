import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CatalogItem {
  id: string;
  type: "product" | "service";
  name: string;
  priceText: string | null;
  description: string | null;
  imageUrl: string | null;
  companyName: string;
  companySlug: string;
}

export async function getCompanyCatalog(companyId: string): Promise<CatalogItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("catalog_items")
    .select("id, type, name, price_text, description, image_url, companies(name, slug)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((i) => {
    const company = i.companies as unknown as { name: string; slug: string } | null;
    return {
      id: i.id,
      type: i.type,
      name: i.name,
      priceText: i.price_text,
      description: i.description,
      imageUrl: i.image_url,
      companyName: company?.name ?? "",
      companySlug: company?.slug ?? "",
    };
  });
}

export async function listCatalog(filters?: { search?: string; type?: "product" | "service" }): Promise<CatalogItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("catalog_items")
    .select("id, type, name, price_text, description, image_url, companies(name, slug)")
    .order("created_at", { ascending: false })
    .limit(60);

  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.search?.trim()) query = query.ilike("name", `%${filters.search.trim()}%`);

  const { data } = await query;

  return (data ?? []).map((i) => {
    const company = i.companies as unknown as { name: string; slug: string } | null;
    return {
      id: i.id,
      type: i.type,
      name: i.name,
      priceText: i.price_text,
      description: i.description,
      imageUrl: i.image_url,
      companyName: company?.name ?? "",
      companySlug: company?.slug ?? "",
    };
  });
}
