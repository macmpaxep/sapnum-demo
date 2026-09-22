import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CompanyProfile {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  industry: string | null;
  website: string | null;
  ownerId: string;
  isOwnerOrAdmin: boolean;
}

export async function getCompanyBySlug(slug: string): Promise<CompanyProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: company } = await supabase
    .from("companies")
    .select("id, slug, name, description, industry, website, owner_id")
    .eq("slug", slug)
    .single();

  if (!company) return null;

  let isOwnerOrAdmin = user?.id === company.owner_id;
  if (!isOwnerOrAdmin && user) {
    const { data: membership } = await supabase
      .from("company_members")
      .select("role")
      .eq("company_id", company.id)
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .maybeSingle();
    isOwnerOrAdmin = Boolean(membership);
  }

  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    description: company.description,
    industry: company.industry,
    website: company.website,
    ownerId: company.owner_id,
    isOwnerOrAdmin,
  };
}

export interface CompanyPost {
  id: string;
  author: string;
  time: string;
  content: string;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "только что";
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "вчера" : `${days} дн назад`;
}

export async function getCompanyPosts(companyId: string): Promise<CompanyPost[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("posts")
    .select("id, body, created_at, profiles!posts_author_id_fkey(display_name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((p) => ({
    id: p.id,
    author: (p.profiles as unknown as { display_name: string } | null)?.display_name ?? "Пользователь",
    time: timeAgo(p.created_at),
    content: p.body,
  }));
}

export interface CompanyApplication {
  id: string;
  applicantName: string;
  type: string;
  status: string;
  message: string;
  requestedAmount: number | null;
  createdAt: string;
}

export async function getCompanyApplications(companyId: string): Promise<CompanyApplication[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("applications")
    .select("id, type, status, message, requested_amount, created_at, profiles!applications_applicant_id_fkey(display_name)")
    .eq("target_company_id", companyId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((a) => ({
    id: a.id,
    applicantName: (a.profiles as unknown as { display_name: string } | null)?.display_name ?? "Пользователь",
    type: a.type,
    status: a.status,
    message: a.message,
    requestedAmount: a.requested_amount,
    createdAt: a.created_at,
  }));
}
