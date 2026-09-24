import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardSummary } from "@/lib/dashboardParse";

export interface CompanyDashboard {
  summary: DashboardSummary;
  aiOverview: string | null;
  sourceFilename: string | null;
  uploadedAt: string;
}

export async function getCompanyDashboard(companyId: string): Promise<CompanyDashboard | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("company_dashboards")
    .select("summary, ai_overview, source_filename, uploaded_at")
    .eq("company_id", companyId)
    .maybeSingle();

  if (!data) return null;

  return {
    summary: data.summary as DashboardSummary,
    aiOverview: data.ai_overview,
    sourceFilename: data.source_filename,
    uploadedAt: data.uploaded_at,
  };
}
