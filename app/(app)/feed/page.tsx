import Link from "next/link";
import TopicsSidebar from "@/components/demo/TopicsSidebar";
import AiPanel from "@/components/demo/AiPanel";
import Chat from "@/components/demo/Chat";
import PostComposer from "@/components/demo/PostComposer";
import PostCard from "@/components/demo/PostCard";
import { getFeedPosts } from "@/lib/queries";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const feedPosts = await getFeedPosts({ topic });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">

      {/* На мобильном TopicsSidebar — аккордеон сверху, на десктопе — левая колонка */}
      <div className="lg:block">
        <TopicsSidebar />
      </div>

      <main className="min-w-0 space-y-4">
        {topic && (
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-medium text-neutral-900 dark:text-paper">
              Тема: <span className="font-semibold">{topic}</span>
            </h1>
            <Link href="/feed" className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-paper">
              Сбросить ×
            </Link>
          </div>
        )}

        <PostComposer />

        {feedPosts.length === 0 && (
          <p className="border border-dashed border-neutral-300 dark:border-line p-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
            Пока нет записей по теме «{topic}»
          </p>
        )}

        {feedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </main>

      {/* Правая колонка — скрыта на мобильном, показывается на десктопе */}
      <div className="flex flex-col gap-6 min-w-0">
        <AiPanel />
        <Chat />
      </div>
    </div>
  );
}
