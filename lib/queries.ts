import { getSupabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { feedPosts as mockFeedPosts } from "@/lib/demo-data";

export type PostCollection = {
  category: string;
  total: number;
  companySlug: string | null;
  items: { id: string; name: string; imageUrl: string | null }[];
};

export type FeedPost = {
  id: string;
  authorId: string;
  authorUsername: string;
  author: string;
  role: string;
  companyName: string | null;
  companySlug: string | null;
  catalogItemId: string | null;
  topic: string;
  time: string;
  createdAt: string;
  content: string;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  repostCount: number;
  viewCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  isMine: boolean;
  collection: PostCollection | null;
};

const POST_SELECT =
  "id, author_id, company_id, collection_category, body, media_urls, topic, created_at, view_count, catalog_item_id, profiles!posts_author_id_fkey(display_name, username), companies(name, industry, slug), post_likes(user_id), post_comments(id)";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
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
      companyName: null,
      companySlug: null,
      catalogItemId: null,
      topic: p.topic,
      time: p.time,
      createdAt: new Date().toISOString(),
      content: p.content,
      mediaUrls: [],
      likeCount: 0,
      commentCount: 0,
      repostCount: 0,
      viewCount: 0,
      likedByMe: false,
      savedByMe: false,
      isMine: false,
      collection: null,
    }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(post: any, viewerId: string | null, savedPostIds: Set<string>, repostCounts: Map<string, number>): FeedPost {
  const author = post.profiles as { display_name: string; username: string } | null;
  const company = post.companies as { name: string; industry: string; slug: string } | null;
  const likes = (post.post_likes as { user_id: string }[]) ?? [];
  const comments = (post.post_comments as { id: string }[]) ?? [];
  return {
    id: post.id,
    authorId: post.author_id,
    authorUsername: author?.username ?? "",
    author: author?.display_name ?? "Пользователь",
    role: company ? `${company.name} · ${company.industry}` : "Участник сообщества",
    companyName: company?.name ?? null,
    companySlug: company?.slug ?? null,
    catalogItemId: post.catalog_item_id ?? null,
    topic: post.topic ?? (company ? "Кейсы" : "Инсайты"),
    time: timeAgo(post.created_at),
    createdAt: post.created_at,
    content: post.body,
    mediaUrls: post.media_urls ?? [],
    likeCount: likes.length,
    commentCount: comments.length,
    repostCount: repostCounts.get(post.id) ?? 0,
    viewCount: post.view_count ?? 0,
    likedByMe: viewerId ? likes.some((l) => l.user_id === viewerId) : false,
    savedByMe: savedPostIds.has(post.id),
    isMine: viewerId === post.author_id,
    collection: null,
  };
}

async function loadRepostCounts(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  postIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!supabase || postIds.length === 0) return counts;

  const { data } = await supabase
    .from("posts")
    .select("repost_of_id, quoted_post_id")
    .or(`repost_of_id.in.(${postIds.join(",")}),quoted_post_id.in.(${postIds.join(",")})`);

  for (const row of data ?? []) {
    const target = row.repost_of_id ?? row.quoted_post_id;
    if (target) counts.set(target, (counts.get(target) ?? 0) + 1);
  }
  return counts;
}


const COLLECTION_PREVIEW = 6;

// A "collection" post stores only (company, category); the preview tiles are
// read live so new items added to the category show up without new posts.
async function attachCollections(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[],
  posts: FeedPost[]
): Promise<void> {
  const wanted = new Map<string, { companyId: string; category: string }>();
  for (const r of rows) {
    if (r.collection_category && r.company_id) {
      wanted.set(`${r.company_id}|${r.collection_category}`, { companyId: r.company_id, category: r.collection_category });
    }
  }
  if (wanted.size === 0) return;

  const results = new Map<string, { total: number; items: PostCollection["items"] }>();
  await Promise.all(
    Array.from(wanted.entries()).map(async ([key, { companyId, category }]) => {
      const { data, count } = await supabase
        .from("catalog_items")
        .select("id, name, image_url, images", { count: "exact" })
        .eq("company_id", companyId)
        .eq("category", category)
        .order("created_at", { ascending: true })
        .limit(COLLECTION_PREVIEW);
      results.set(key, {
        total: count ?? data?.length ?? 0,
        items: (data ?? []).map((i) => ({ id: i.id, name: i.name, imageUrl: i.image_url ?? i.images?.[0] ?? null })),
      });
    })
  );

  posts.forEach((post, idx) => {
    const r = rows[idx];
    const res = r.collection_category && r.company_id ? results.get(`${r.company_id}|${r.collection_category}`) : null;
    if (res) post.collection = { category: r.collection_category, total: res.total, items: res.items, companySlug: post.companySlug };
  });
}

export async function getFeedPosts(filters?: { topic?: string; authorId?: string }): Promise<FeedPost[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return mockTextPosts();

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filters?.topic) query = query.eq("topic", filters.topic);
  if (filters?.authorId) query = query.eq("author_id", filters.authorId);

  const [{ data }, viewer] = await Promise.all([query, getCurrentUser()]);

  if (!data || data.length === 0) {
    return filters?.topic || filters?.authorId ? [] : mockTextPosts();
  }

  const postIds = data.map((p) => p.id);
  const savedPostIds = new Set<string>();
  if (viewer) {
    const { data: saved } = await supabase.from("saved_posts").select("post_id").eq("user_id", viewer.id).in("post_id", postIds);
    for (const s of saved ?? []) savedPostIds.add(s.post_id);
  }

  const repostCounts = await loadRepostCounts(supabase, postIds);

  const mapped = data.map((post) => mapRow(post, viewer?.id ?? null, savedPostIds, repostCounts));
  await attachCollections(supabase, data, mapped);
  return mapped;
}

export async function getPostById(id: string): Promise<FeedPost | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const [{ data: post }, viewer] = await Promise.all([
    supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle(),
    getCurrentUser(),
  ]);
  if (!post) return null;

  const savedPostIds = new Set<string>();
  if (viewer) {
    const { data: saved } = await supabase.from("saved_posts").select("post_id").eq("user_id", viewer.id).eq("post_id", id);
    if (saved && saved.length > 0) savedPostIds.add(id);
  }

  const repostCounts = await loadRepostCounts(supabase, [id]);

  const mapped = mapRow(post, viewer?.id ?? null, savedPostIds, repostCounts);
  await attachCollections(supabase, [post], [mapped]);
  return mapped;
}
