"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CurrentUser } from "@/lib/auth";

// Client-side mirror of lib/auth.ts's getCurrentUser(), for client components
// (TopBar, buttons) that need to react to login/logout without a page reload.
export function useUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function loadUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, username, display_name, avatar_url").eq("id", authUser.id).single(),
        supabase.from("user_roles").select("role").eq("user_id", authUser.id),
      ]);

      if (!profile) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        roles: (roles ?? []).map((r) => r.role) as CurrentUser["roles"],
      });
      setLoading(false);
    }

    loadUser();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { user, loading };
}
