import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/telegramNotify";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  notifyAdmin(`🚩 Жалоба на запись\nhttps://sapnum.com/post/${postId}\nОт: ${user.id}`).catch(() => {});

  return NextResponse.json({ ok: true });
}
