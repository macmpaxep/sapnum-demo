import { notFound } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/demo/Avatar";
import BackButton from "@/components/demo/BackButton";
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
      <BackButton />
      <div className="rounded-lg border border-neutral-200 dark:border-line p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar initials={initials} size={64} imageUrl={profile.avatarUrl ?? undefined} />
            <div>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-paper">{profile.displayName}</h1>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">@{profile.username}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {profile.roles.map((r) => (
                  <span key={r} className="rounded-lg border border-neutral-200 dark:border-line px-2 py-0.5 text-xs text-neutral-600 dark:text-neutral-400">
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
            <Link href="/profile" className="rounded-lg border border-neutral-300 dark:border-line px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-mute">
              Редактировать
            </Link>
          )}
        </div>

        {profile.bio && <p className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{profile.bio}</p>}

        <div className="mt-4 flex gap-4 text-sm text-neutral-500 dark:text-neutral-400">
          <Link href={`/u/${profile.username}/followers`} className="hover:underline">
            <span className="font-medium text-neutral-900 dark:text-paper">{profile.followerCount}</span> подписчиков
          </Link>
          <Link href={`/u/${profile.username}/following`} className="hover:underline">
            <span className="font-medium text-neutral-900 dark:text-paper">{profile.followingCount}</span> подписок
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-900 dark:text-paper">
          {profile.isOwnProfile ? "Мои записи" : "Записи"}
        </h2>
        {posts.length === 0 && <p className="text-sm text-neutral-500 dark:text-neutral-400">Пока нет записей.</p>}
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
