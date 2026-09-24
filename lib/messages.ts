import { createSupabaseServerClient } from "@/lib/supabase/server";

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export interface ConversationSummary {
  id: string;
  otherUserId: string;
  otherUsername: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  preview: string;
  lastMessageAt: string | null;
  // True when someone else messaged *me* first and I haven't replied yet —
  // shown under a separate "Запросы" tab instead of the regular inbox.
  isRequest: boolean;
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  const conversationIds = (mine ?? []).map((c) => c.conversation_id);
  if (conversationIds.length === 0) return [];

  const [{ data: others }, { data: convRows }, { data: messages }] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("conversation_id, profiles(id, username, display_name, avatar_url)")
      .in("conversation_id", conversationIds)
      .neq("user_id", userId),
    supabase.from("conversations").select("id, initiator_id, accepted").in("id", conversationIds),
    supabase
      .from("messages")
      .select("conversation_id, body, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
  ]);

  const lastByConversation = new Map<string, { body: string; created_at: string }>();
  for (const m of messages ?? []) {
    if (!lastByConversation.has(m.conversation_id)) {
      lastByConversation.set(m.conversation_id, { body: m.body ?? "", created_at: m.created_at });
    }
  }

  const convById = new Map((convRows ?? []).map((c) => [c.id, c]));

  const list = (others ?? [])
    .map((p) => {
      const profile = p.profiles as unknown as { id: string; username: string; display_name: string; avatar_url: string | null } | null;
      if (!profile) return null;
      const last = lastByConversation.get(p.conversation_id);
      const conv = convById.get(p.conversation_id);
      return {
        id: p.conversation_id,
        otherUserId: profile.id,
        otherUsername: profile.username,
        name: profile.display_name,
        initials: initialsOf(profile.display_name),
        avatarUrl: profile.avatar_url,
        preview: last?.body ?? "",
        lastMessageAt: last?.created_at ?? null,
        isRequest: Boolean(conv && !conv.accepted && conv.initiator_id !== userId),
      };
    })
    .filter((c): c is ConversationSummary => c !== null);

  list.sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
  return list;
}

export interface ThreadMessage {
  id: string;
  senderId: string;
  body: string;
  mediaUrl: string | null;
  createdAt: string;
}

export async function getThread(conversationId: string): Promise<{
  otherUser: {
    id: string;
    username: string;
    name: string;
    initials: string;
    avatarUrl: string | null;
    followerCount: number;
    isFollowedByMe: boolean;
    isFollowingMe: boolean;
  } | null;
  messages: ThreadMessage[];
  accepted: boolean;
  isInitiator: boolean;
  requestMessagesLeft: number;
}> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: participants }, { data: messages }, { data: conversation }] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("user_id, profiles(id, username, display_name, avatar_url)")
      .eq("conversation_id", conversationId),
    supabase
      .from("messages")
      .select("id, sender_id, body, media_url, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
    supabase.from("conversations").select("initiator_id, accepted").eq("id", conversationId).single(),
  ]);

  const otherParticipant = (participants ?? []).find((p) => p.user_id !== user?.id);
  const otherProfile = otherParticipant?.profiles as unknown as
    | { id: string; username: string; display_name: string; avatar_url: string | null }
    | undefined;

  let otherUser = null;
  if (otherProfile) {
    const [{ count: followerCount }, followedByMe, followingMe] = await Promise.all([
      supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", otherProfile.id),
      user
        ? supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", otherProfile.id).maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? supabase.from("follows").select("follower_id").eq("follower_id", otherProfile.id).eq("following_id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    otherUser = {
      id: otherProfile.id,
      username: otherProfile.username,
      name: otherProfile.display_name,
      initials: initialsOf(otherProfile.display_name),
      avatarUrl: otherProfile.avatar_url,
      followerCount: followerCount ?? 0,
      isFollowedByMe: Boolean(followedByMe.data),
      isFollowingMe: Boolean(followingMe.data),
    };
  }

  const isInitiator = conversation?.initiator_id === user?.id;
  const accepted = conversation?.accepted ?? true;
  const myMessageCount = (messages ?? []).filter((m) => m.sender_id === user?.id).length;

  return {
    otherUser,
    messages: (messages ?? []).map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      body: m.body ?? "",
      mediaUrl: m.media_url ?? null,
      createdAt: m.created_at,
    })),
    accepted,
    isInitiator,
    requestMessagesLeft: !accepted && isInitiator ? Math.max(0, 3 - myMessageCount) : Infinity,
  };
}

export async function markThreadRead(conversationId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);
}
