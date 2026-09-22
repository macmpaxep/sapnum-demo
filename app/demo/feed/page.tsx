import TopicsSidebar from "@/components/demo/TopicsSidebar";
import AiPanel from "@/components/demo/AiPanel";
import Chat from "@/components/demo/Chat";
import PostComposer from "@/components/demo/PostComposer";
import PostCard from "@/components/demo/PostCard";
import { getFeedPosts } from "@/lib/queries";

export default async function FeedPage() {
  const feedPosts = await getFeedPosts();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">

      {/* На мобильном TopicsSidebar — аккордеон сверху, на десктопе — левая колонка */}
      <div className="lg:block">
        <TopicsSidebar />
      </div>

      <main className="min-w-0 space-y-4">
        <PostComposer />

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
