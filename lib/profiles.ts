import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/auth";

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  roles: UserRole[];
  followerCount: number;
  followingCount: number;
  isFollowedByMe: boolean;
  isOwnProfile: boolean;
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return null;

  const [{ data: roles }, { count: followerCount }, { count: followingCount }, followCheck] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", profile.id),
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", profile.id),
    supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", profile.id),
    viewer
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", viewer.id)
          .eq("following_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    roles: (roles ?? []).map((r) => r.role as UserRole),
    followerCount: followerCount ?? 0,
    followingCount: followingCount ?? 0,
    isFollowedByMe: Boolean(followCheck.data),
    isOwnProfile: viewer?.id === profile.id,
  };
}

export async function listFollowers(userId: string): Promise<DirectoryPerson[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("follows")
    .select("profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, bio, user_roles(role))")
    .eq("following_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .map((row) => row.profiles as unknown as {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      bio: string | null;
      user_roles: { role: string }[];
    } | null)
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map((p) => ({
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      bio: p.bio,
      roles: (p.user_roles ?? []).map((r) => r.role as UserRole),
    }));
}

export async function listFollowing(userId: string): Promise<DirectoryPerson[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("follows")
    .select("profiles!follows_following_id_fkey(id, username, display_name, avatar_url, bio, user_roles(role))")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .map((row) => row.profiles as unknown as {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      bio: string | null;
      user_roles: { role: string }[];
    } | null)
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map((p) => ({
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      bio: p.bio,
      roles: (p.user_roles ?? []).map((r) => r.role as UserRole),
    }));
}

export interface DirectoryPerson {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  roles: UserRole[];
}

export async function listPeople(search?: string): Promise<DirectoryPerson[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, user_roles(role)")
    .order("created_at", { ascending: false })
    .limit(60);

  if (search?.trim()) {
    query = query.or(`display_name.ilike.%${search.trim()}%,username.ilike.%${search.trim()}%`);
  }

  const { data } = await query;

  return (data ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
    bio: p.bio,
    roles: ((p.user_roles as unknown as { role: string }[]) ?? []).map((r) => r.role as UserRole),
  }));
}
