import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/social";

// Plain repost (empty body) or a quote-repost (body carries the comment)
// of the original post, mirroring repost_of_id / quoted_post_id in the schema.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  let body: { quoteText?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { data: original } = await supabase.from("posts").select("author_id").eq("id", postId).single();
  if (!original) return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });

  const quoteText = body.quoteText?.trim();
  const isQuote = Boolean(quoteText);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      body: quoteText ?? "",
      repost_of_id: isQuote ? null : postId,
      quoted_post_id: isQuote ? postId : null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity(supabase, {
    recipientId: original.author_id,
    actorId: user.id,
    type: isQuote ? "quote" : "repost",
    postId,
  });

  return NextResponse.json({ post: data });
}
