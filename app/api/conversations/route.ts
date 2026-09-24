import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/telegramNotify";

// Finds an existing 1:1 conversation with the given user, or creates one.
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: { otherUserId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const otherUserId = body.otherUserId?.trim();
  if (!otherUserId || otherUserId === user.id) {
    return NextResponse.json({ error: "Некорректный получатель" }, { status: 400 });
  }

  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  const myConversationIds = (mine ?? []).map((c) => c.conversation_id);

  if (myConversationIds.length > 0) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myConversationIds);

    if (shared && shared.length > 0) {
      return NextResponse.json({ conversationId: shared[0].conversation_id });
    }
  }

  // Generate the id ourselves and skip .select() on the insert: with RLS,
  // "INSERT ... RETURNING" also has to satisfy the table's SELECT policy,
  // and a brand-new conversation has no participants yet at that instant —
  // "participants can read their conversations" would reject the RETURNING
  // row even though the INSERT itself is allowed. Not chaining .select()
  // makes postgrest use `Prefer: return=minimal`, side-stepping that.
  const conversationId = crypto.randomUUID();

  // A conversation started with someone you've never talked to before is a
  // "request", capped to 3 messages from the initiator until the other
  // person replies (see /api/messages) — mirrors Threads' DM requests.
  const { error: convError } = await supabase
    .from("conversations")
    .insert({ id: conversationId, is_group: false, initiator_id: user.id, accepted: false });

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 400 });
  }

  const { error: participantsError } = await supabase.from("conversation_participants").insert([
    { conversation_id: conversationId, user_id: user.id },
    { conversation_id: conversationId, user_id: otherUserId },
  ]);

  if (participantsError) {
    return NextResponse.json({ error: participantsError.message }, { status: 400 });
  }

  notifyAdmin(`💬 Начат новый диалог между пользователями`);

  return NextResponse.json({ conversationId });
}
