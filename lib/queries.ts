import { getSupabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { feedPosts as mockFeedPosts } from "@/lib/demo-data";

export type FeedPost = {
  id: string;
  authorId: string;
  authorUsername: string;
  author: string;
  role: string;
  topic: string;
  time: string;
  content: string;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "только что";
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "вчера" : `${days} дн назад`;
}

function mockTextPosts(): FeedPost[] {
  return mockFeedPosts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p, i) => ({
      id: `mock-${i}`,
      authorId: `mock-author-${i}`,
      authorUsername: "",
      author: p.author,
      role: p.role,
      topic: p.topic,
      time: p.time,
      content: p.content,
      mediaUrls: [],
      likeCount: 0,
      commentCount: 0,
      likedByMe: false,
      savedByMe: false,
    }));
}

export async function getFeedPosts(filters?: { topic?: string; authorId?: string }): Promise<FeedPost[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return mockTextPosts();

  let query = supabase
    .from("posts")
    .select(
      "id, author_id, body, media_urls, topic, created_at, profiles!posts_author_id_fkey(display_name, username), companies(name, industry), post_likes(user_id), post_comments(id)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (filters?.topic) query = query.eq("topic", filters.topic);
  if (filters?.authorId) query = query.eq("author_id", filters.authorId);

  const [{ data }, viewer] = await Promise.all([query, getCurrentUser()]);

  if (!data || data.length === 0) {
    return filters?.topic || filters?.authorId ? [] : mockTextPosts();
  }

  const savedPostIds = new Set<string>();
  if (viewer) {
    const { data: saved } = await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", viewer.id)
      .in("post_id", data.map((p) => p.id));
    for (const s of saved ?? []) savedPostIds.add(s.post_id);
  }

  return data.map((post) => {
    const author = post.profiles as unknown as { display_name: string; username: string } | null;
    const company = post.companies as unknown as { name: string; industry: string } | null;
    const likes = (post.post_likes as unknown as { user_id: string }[]) ?? [];
    const comments = (post.post_comments as unknown as { id: string }[]) ?? [];
    return {
      id: post.id,
      authorId: post.author_id,
      authorUsername: author?.username ?? "",
      author: author?.display_name ?? "Пользователь",
      role: company ? `${company.name} · ${company.industry}` : "Участник сообщества",
      topic: post.topic ?? (company ? "Кейсы" : "Инсайты"),
      time: timeAgo(post.created_at),
      content: post.body,
      mediaUrls: post.media_urls ?? [],
      likeCount: likes.length,
      commentCount: comments.length,
      likedByMe: viewer ? likes.some((l) => l.user_id === viewer.id) : false,
      savedByMe: savedPostIds.has(post.id),
    };
  });
}
