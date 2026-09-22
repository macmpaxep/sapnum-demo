import { notFound } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/demo/Avatar";
import PostCard from "@/components/demo/PostCard";
import FollowButton from "@/components/profile/FollowButton";
import MessageButton from "@/components/company/MessageButton";
import { getPublicProfile } from "@/lib/profiles";
import { getFeedPosts } from "@/lib/queries";

const ROLE_LABELS: Record<string, string> = {
  simple: "Пользователь",
  business: "Бизнес",
  investor: "Инвестор",
  admin: "Админ",
};

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const posts = await getFeedPosts({ authorId: profile.id });

  const initials = profile.displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="space-y-6">
      <div className="border border-neutral-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar initials={initials} size={64} imageUrl={profile.avatarUrl ?? undefined} />
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">{profile.displayName}</h1>
              <div className="text-sm text-neutral-500">@{profile.username}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {profile.roles.map((r) => (
                  <span key={r} className="border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
                    {ROLE_LABELS[r] ?? r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {!profile.isOwnProfile && (
            <div className="flex gap-2">
              <MessageButton otherUserId={profile.id} />
              <FollowButton userId={profile.id} initiallyFollowed={profile.isFollowedByMe} />
            </div>
          )}
          {profile.isOwnProfile && (
            <Link href="/profile" className="border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:border-neutral-400">
              Редактировать
            </Link>
          )}
        </div>

        {profile.bio && <p className="mt-4 text-sm leading-relaxed text-neutral-700">{profile.bio}</p>}

        <div className="mt-4 flex gap-4 text-sm text-neutral-500">
          <span>
            <span className="font-medium text-neutral-900">{profile.followerCount}</span> подписчиков
          </span>
          <span>
            <span className="font-medium text-neutral-900">{profile.followingCount}</span> подписок
          </span>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-900">
          {profile.isOwnProfile ? "Мои записи" : "Записи"}
        </h2>
        {posts.length === 0 && <p className="text-sm text-neutral-500">Пока нет записей.</p>}
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
