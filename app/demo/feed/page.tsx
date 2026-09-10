import TopicsSidebar from "@/components/demo/TopicsSidebar";
import AiPanel from "@/components/demo/AiPanel";
import Chat from "@/components/demo/Chat";
import Avatar from "@/components/demo/Avatar";
import Sparkline from "@/components/demo/Sparkline";
import { feedPosts } from "@/lib/demo-data";

const postTypeIcons = ["Фото", "График", "Файл"];

export default function FeedPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
      
      {/* На мобильном TopicsSidebar — аккордеон сверху, на десктопе — левая колонка */}
      <div className="lg:block">
        <TopicsSidebar />
      </div>

      <main className="min-w-0 space-y-4">
        {/* Composer */}
        <div className="border border-neutral-200 p-4">
          <div className="flex items-start gap-3">
            <Avatar initials="ВЫ" />
            <input
              placeholder="Напишите что-нибудь…"
              className="flex-1 border-b border-neutral-200 pb-2 text-sm text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
              readOnly
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 pl-0 sm:pl-[44px] text-xs text-neutral-400">
            <span>Тип записи:</span>
            {postTypeIcons.map((t) => (
              <span
                key={t}
                className="cursor-pointer border border-neutral-200 px-2 py-1 hover:border-neutral-400 hover:text-neutral-700"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Posts */}
        {feedPosts.map((post, i) => (
          <article key={i} className="border border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <Avatar initials={post.author.split(" ").map((w: string) => w[0]).join("")} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-neutral-900">
                  {post.author}
                </div>
                <div className="truncate text-xs text-neutral-500">
                  {post.role}
                </div>
              </div>
              <div className="shrink-0 text-right text-xs text-neutral-400">
                <div>{post.topic}</div>
                <div>{post.time}</div>
              </div>
            </div>

            {post.type === "text" && (
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                {post.content}
              </p>
            )}

            {post.type === "chart" && (
              <div className="mt-3">
                <div className="h-32 border border-neutral-100 bg-neutral-50 p-2">
                  <Sparkline data={post.series} />
                </div>
                <p className="num mt-2 font-mono text-sm text-neutral-900">
                  {post.caption}
                </p>
              </div>
            )}

            {post.type === "doc" && (
              <div className="mt-3 flex items-center gap-3 border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-neutral-300 bg-white text-xs text-neutral-400">
                  PDF
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-900">
                    {post.title}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {post.subtitle}
                  </div>
                </div>
              </div>
            )}
          </article>
        ))}
      </main>

      {/* AiPanel — скрыт на мобильном, показывается на десктопе */}
      <div>
        <AiPanel />
      </div>

      {/* Chat */}
      <div>
        <Chat />
      </div>

    </div>
  );
}