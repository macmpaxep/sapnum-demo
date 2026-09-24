import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "@/components/demo/PostCard";
import { getPostById } from "@/lib/queries";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  const supabase = getSupabaseAdmin();
  supabase?.rpc("increment_post_view", { p_id: id }).then(
    () => {},
    () => {}
  );

  return (
    <div className="space-y-4">
      <Link href="/feed" className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        ← В ленту
      </Link>
      <div className="text-center">
        <h1 className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Запись</h1>
        {post.viewCount > 0 && <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{post.viewCount} просмотров</p>}
      </div>
      <PostCard post={post} linkToPost={false} />
    </div>
  );
}
