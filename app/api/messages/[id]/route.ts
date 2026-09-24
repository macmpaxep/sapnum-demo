import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DELETE_WINDOW_MS = 15 * 60 * 1000;

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { data: message } = await supabase.from("messages").select("sender_id, created_at").eq("id", id).single();
  if (!message || message.sender_id !== user.id) {
    return NextResponse.json({ error: "Сообщение не найдено" }, { status: 404 });
  }
  if (Date.now() - new Date(message.created_at).getTime() > DELETE_WINDOW_MS) {
    return NextResponse.json({ error: "Удалить можно только в течение 15 минут после отправки" }, { status: 403 });
  }

  const { error } = await supabase.from("messages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
