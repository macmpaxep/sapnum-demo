import type { SupabaseClient } from "@supabase/supabase-js";

// Logs an activity entry, ignoring self-actions (liking/commenting on your
// own post shouldn't notify you) and swallowing failures — activity logging
// is best-effort and must never block the primary action.
export async function logActivity(
  supabase: SupabaseClient,
  params: {
    recipientId: string;
    actorId: string;
    type: "like" | "comment" | "repost" | "follow" | "quote";
    postId?: string;
  }
) {
  if (params.recipientId === params.actorId) return;
  await supabase.from("activities").insert({
    recipient_id: params.recipientId,
    actor_id: params.actorId,
    type: params.type,
    post_id: params.postId ?? null,
  });
}
