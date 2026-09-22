import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({ is_group: false })
    .select("id")
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: convError?.message ?? "Не удалось создать диалог" }, { status: 400 });
  }

  const { error: participantsError } = await supabase.from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: user.id },
    { conversation_id: conversation.id, user_id: otherUserId },
  ]);

  if (participantsError) {
    return NextResponse.json({ error: participantsError.message }, { status: 400 });
  }

  return NextResponse.json({ conversationId: conversation.id });
}
