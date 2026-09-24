import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMyActivity } from "@/lib/activity";

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
        {activity.map((a) => (
          <div key={a.id} className="px-4 py-3 text-sm">
            <span className="font-medium text-neutral-900 dark:text-paper">{a.actorName}</span>{" "}
            <span className="text-neutral-600 dark:text-neutral-400">{a.text}</span>
            <span className="ml-2 text-xs text-neutral-400 dark:text-neutral-500">{timeAgo(a.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
