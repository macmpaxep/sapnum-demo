import { getSupabaseAdmin } from "@/lib/supabase";
import { DEMO_USER_ID } from "@/lib/demo-user";
import { getCurrentUser } from "@/lib/auth";
import { conversations as mockConversations, chatContacts as mockContacts, feedPosts as mockFeedPosts } from "@/lib/demo-data";

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export type ChatConversation = {
  id: string;
  initials: string;
  name: string;
  preview: string;
};

function mockConversationsWithId(): ChatConversation[] {
  return mockConversations.map((c, i) => ({ id: `mock-${i}`, ...c }));
}

export async function getChatConversations(): Promise<{
  contacts: { initials: string; name: string }[];
  conversations: ChatConversation[];
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { contacts: mockContacts, conversations: mockConversationsWithId() };
  }

  const { data: myConversations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", DEMO_USER_ID);

  const conversationIds = (myConversations ?? []).map((c) => c.conversation_id);
  if (conversationIds.length === 0) {
    return { contacts: mockContacts, conversations: mockConversationsWithId() };
  }

  const { data: otherParticipants } = await supabase
    .from("conversation_participants")
    .select("conversation_id, profiles(id, display_name)")
    .in("conversation_id", conversationIds)
    .neq("user_id", DEMO_USER_ID);

  const { data: lastMessages } = await supabase
    .from("messages")
    .select("conversation_id, body, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  const lastMessageByConversation = new Map<string, string>();
  for (const m of lastMessages ?? []) {
    if (!lastMessageByConversation.has(m.conversation_id)) {
      lastMessageByConversation.set(m.conversation_id, m.body ?? "");
    }
  }

  const result: ChatConversation[] = (otherParticipants ?? [])
    .map((p) => {
      const profile = p.profiles as unknown as { id: string; display_name: string } | null;
      if (!profile) return null;
      return {
        id: p.conversation_id,
        initials: initialsOf(profile.display_name),
        name: profile.display_name,
        preview: lastMessageByConversation.get(p.conversation_id) ?? "",
      };
    })
    .filter((c): c is ChatConversation => c !== null);

  const contacts = result.map((c) => ({ initials: c.initials, name: c.name }));

  return { contacts, conversations: result };
}

export type FeedPost = {
  id: string;
  authorId: string;
  author: string;
  role: string;
  topic: string;
  time: string;
  content: string;
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
      author: p.author,
      role: p.role,
      topic: p.topic,
      time: p.time,
      content: p.content,
      likeCount: 0,
      commentCount: 0,
      likedByMe: false,
      savedByMe: false,
    }));
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return mockTextPosts();

  const [{ data }, viewer] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, author_id, body, created_at, profiles!posts_author_id_fkey(display_name), companies(name, industry), post_likes(user_id), post_comments(id)"
      )
      .order("created_at", { ascending: false })
      .limit(20),
    getCurrentUser(),
  ]);

  if (!data || data.length === 0) {
    return mockTextPosts();
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
    const author = post.profiles as unknown as { display_name: string } | null;
    const company = post.companies as unknown as { name: string; industry: string } | null;
    const likes = (post.post_likes as unknown as { user_id: string }[]) ?? [];
    const comments = (post.post_comments as unknown as { id: string }[]) ?? [];
    return {
      id: post.id,
      authorId: post.author_id,
      author: author?.display_name ?? "Пользователь",
      role: company ? `${company.name} · ${company.industry}` : "Участник сообщества",
      topic: company ? "Кейсы" : "Инсайты",
      time: timeAgo(post.created_at),
      content: post.body,
      likeCount: likes.length,
      commentCount: comments.length,
      likedByMe: viewer ? likes.some((l) => l.user_id === viewer.id) : false,
      savedByMe: savedPostIds.has(post.id),
    };
  });
}
