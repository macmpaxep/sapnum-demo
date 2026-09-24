import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Sends a message in an existing conversation. RLS enforces that the
// caller is an authenticated participant of that conversation.
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: { conversationId?: string; text?: string; mediaUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const conversationId = body.conversationId?.trim();
  const text = body.text?.trim() ?? "";
  const mediaUrl = body.mediaUrl?.trim() || null;
  if (!conversationId || (!text && !mediaUrl)) {
    return NextResponse.json({ error: "Заполните сообщение" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: text, media_url: mediaUrl })
    .select("id, sender_id, body, media_url, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: data });
}
