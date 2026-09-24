import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/social";
import { moderateText } from "@/lib/moderation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("post_comments")
    .select("id, body, created_at, author_id, profiles!post_comments_author_id_fkey(display_name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ comments: data });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) return NextResponse.json({ error: "Введите комментарий" }, { status: 400 });

  const textCheck = await moderateText(text);
  if (!textCheck.allowed) {
    return NextResponse.json({ error: textCheck.reason ?? "Комментарий не прошёл модерацию" }, { status: 422 });
  }

  const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single();
  if (!post) return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });

  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, author_id: user.id, body: text })
    .select("id, body, created_at, author_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(supabase, { recipientId: post.author_id, actorId: user.id, type: "comment", postId });

  return NextResponse.json({ comment: data });
}
