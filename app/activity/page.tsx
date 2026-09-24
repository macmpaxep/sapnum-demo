import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMyActivity } from "@/lib/activity";
import Avatar from "@/components/demo/Avatar";
import UserHoverCard from "@/components/demo/UserHoverCard";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "только что";
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "вчера" : `${days} дн назад`;
}

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const activity = await getMyActivity(user.id);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-paper">Активность на вашей странице</h1>

      {activity.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">Пока никакой активности нет.</p>
      )}

      <div className="mt-4 divide-y divide-neutral-100 dark:divide-line overflow-hidden rounded-lg border border-neutral-200 dark:border-line">
        {activity.map((a) => {
          const postHref = a.postId ? (a.catalogItemId ? `/item/${a.catalogItemId}` : `/post/${a.postId}`) : null;
          const initials = a.actorName.split(" ").map((w) => w[0]).join("");

          return (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              {a.actorUsername ? (
                <Link href={`/u/${a.actorUsername}`} className="shrink-0">
                  <Avatar initials={initials} size={36} imageUrl={a.actorAvatarUrl ?? undefined} />
                </Link>
              ) : (
                <Avatar initials={initials} size={36} />
              )}

              <div className="min-w-0 flex-1">
                {a.actorUsername ? (
                  <UserHoverCard username={a.actorUsername}>
                    <span className="font-medium text-neutral-900 dark:text-paper hover:underline">{a.actorName}</span>
                  </UserHoverCard>
                ) : (
                  <span className="font-medium text-neutral-900 dark:text-paper">{a.actorName}</span>
                )}{" "}
                <span className="text-neutral-600 dark:text-neutral-400">{a.text}</span>
                <div className="text-xs text-neutral-400 dark:text-neutral-500">{timeAgo(a.createdAt)}</div>
              </div>

              {postHref && (
                <Link href={postHref} className="shrink-0" aria-label="Открыть запись">
                  {a.postMediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.postMediaUrl} alt="" className="h-12 w-12 rounded-lg object-cover border border-neutral-200 dark:border-line" />
                  ) : a.postPreview ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-200 dark:border-line p-1.5">
                      <span className="line-clamp-3 text-center text-[9px] leading-tight text-neutral-500 dark:text-neutral-400">
                        {a.postPreview.slice(0, 40)}
                      </span>
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-lg border border-dashed border-neutral-200 dark:border-line" />
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
