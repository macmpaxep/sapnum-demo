"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Client-side companion to lib/companies.ts's getCompanySlugForUser(), used
// by TopBar to decide whether to show the "Дашборд" nav tab at all — it's
// meaningless for a user with no company.
export function useMyCompany(userId: string | undefined) {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setSlug(null);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    async function load() {
      const { data: owned } = await supabase.from("companies").select("slug").eq("owner_id", userId).maybeSingle();
      if (owned) {
        if (!cancelled) setSlug(owned.slug);
        return;
      }

      const { data: membership } = await supabase
        .from("company_members")
        .select("companies(slug)")
        .eq("user_id", userId)
        .maybeSingle();

      const company = membership?.companies as unknown as { slug: string } | null;
      if (!cancelled) setSlug(company?.slug ?? null);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return slug;
}
