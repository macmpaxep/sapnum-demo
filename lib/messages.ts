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
  name: string;
  initials: string;
  preview: string;
  lastMessageAt: string | null;
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  const conversationIds = (mine ?? []).map((c) => c.conversation_id);
  if (conversationIds.length === 0) return [];

  const { data: others } = await supabase
    .from("conversation_participants")
    .select("conversation_id, profiles(id, display_name)")
    .in("conversation_id", conversationIds)
    .neq("user_id", userId);

  const { data: messages } = await supabase
    .from("messages")
    .select("conversation_id, body, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  const lastByConversation = new Map<string, { body: string; created_at: string }>();
  for (const m of messages ?? []) {
    if (!lastByConversation.has(m.conversation_id)) {
      lastByConversation.set(m.conversation_id, { body: m.body ?? "", created_at: m.created_at });
    }
  }

  const list = (others ?? [])
    .map((p) => {
      const profile = p.profiles as unknown as { id: string; display_name: string } | null;
      if (!profile) return null;
      const last = lastByConversation.get(p.conversation_id);
      return {
        id: p.conversation_id,
        otherUserId: profile.id,
        name: profile.display_name,
        initials: initialsOf(profile.display_name),
        preview: last?.body ?? "",
        lastMessageAt: last?.created_at ?? null,
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
  createdAt: string;
}

export async function getThread(conversationId: string): Promise<{
  otherUser: { id: string; name: string; initials: string } | null;
  messages: ThreadMessage[];
}> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: participants }, { data: messages }] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("user_id, profiles(id, display_name)")
      .eq("conversation_id", conversationId),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  ]);

  const otherParticipant = (participants ?? []).find((p) => p.user_id !== user?.id);
  const otherProfile = otherParticipant?.profiles as unknown as { id: string; display_name: string } | undefined;

  return {
    otherUser: otherProfile
      ? { id: otherProfile.id, name: otherProfile.display_name, initials: initialsOf(otherProfile.display_name) }
      : null,
    messages: (messages ?? []).map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      body: m.body ?? "",
      createdAt: m.created_at,
    })),
  };
}
