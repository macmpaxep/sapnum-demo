import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserRole = "simple" | "business" | "investor" | "admin";

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  roles: UserRole[];
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url").eq("id", user.id).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  if (!profile) return null;

  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    roles: (roles ?? []).map((r) => r.role as UserRole),
  };
}

export function hasRole(user: CurrentUser | null, role: UserRole): boolean {
  return user?.roles.includes(role) ?? false;
}
