import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface MyApplication {
  id: string;
  type: string;
  status: string;
  message: string;
  requestedAmount: number | null;
  createdAt: string;
  companyName: string;
  companySlug: string;
}

export async function getMyApplications(userId: string): Promise<MyApplication[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("applications")
    .select("id, type, status, message, requested_amount, created_at, companies(name, slug)")
    .eq("applicant_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((a) => {
    const company = a.companies as unknown as { name: string; slug: string } | null;
    return {
      id: a.id,
      type: a.type,
      status: a.status,
      message: a.message,
      requestedAmount: a.requested_amount,
      createdAt: a.created_at,
      companyName: company?.name ?? "Компания",
      companySlug: company?.slug ?? "",
    };
  });
}
