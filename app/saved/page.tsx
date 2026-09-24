import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMySavedPosts } from "@/lib/activity";

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const saved = await getMySavedPosts(user.id);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Сохранённые записи</h1>

      {saved.length === 0 && <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">У вас пока нет сохранённых записей.</p>}

      <div className="mt-4 space-y-3">
        {saved.map((s) => (
          <article key={s.id} className="border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{s.author}</div>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{s.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
