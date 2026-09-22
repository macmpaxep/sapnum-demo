import { createSupabaseServerClient } from "@/lib/supabase/server";

const TYPE_TEXT: Record<string, string> = {
  like: "лайкнул(а) вашу запись",
  comment: "прокомментировал(а) вашу запись",
  repost: "сделал(а) репост вашей записи",
  quote: "процитировал(а) вашу запись",
  follow: "подписался(ась) на вас",
};

export interface ActivityItem {
  id: string;
  actorName: string;
  text: string;
  postId: string | null;
  createdAt: string;
}

export async function getMyActivity(userId: string): Promise<ActivityItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("activities")
    .select("id, type, post_id, created_at, profiles!activities_actor_id_fkey(display_name)")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((a) => ({
    id: a.id,
    actorName: (a.profiles as unknown as { display_name: string } | null)?.display_name ?? "Пользователь",
    text: TYPE_TEXT[a.type] ?? a.type,
    postId: a.post_id,
    createdAt: a.created_at,
  }));
}

export interface SavedPostItem {
  id: string;
  author: string;
  content: string;
  savedAt: string;
}

export async function getMySavedPosts(userId: string): Promise<SavedPostItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("saved_posts")
    .select("created_at, posts(id, body, profiles!posts_author_id_fkey(display_name))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .map((s) => {
      const post = s.posts as unknown as { id: string; body: string; profiles: { display_name: string } | null } | null;
      if (!post) return null;
      return {
        id: post.id,
        author: post.profiles?.display_name ?? "Пользователь",
        content: post.body,
        savedAt: s.created_at,
      };
    })
    .filter((s): s is SavedPostItem => s !== null);
}
