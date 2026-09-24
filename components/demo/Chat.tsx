import Link from "next/link";
import Avatar from "./Avatar";
import { getCurrentUser } from "@/lib/auth";
import { listConversations } from "@/lib/messages";

export default async function Chat() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <aside className="w-full min-w-0">
        <section className="rounded-lg border border-neutral-200 dark:border-line p-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-paper">Чат</h2>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            <Link href="/login" className="underline hover:text-neutral-900 dark:hover:text-paper">
              Войдите
            </Link>
            , чтобы переписываться с другими пользователями.
          </p>
        </section>
      </aside>
    );
  }

  const conversations = await listConversations(user.id);

  return (
    <aside className="flex flex-col gap-6 min-w-0 w-full overflow-hidden">
      <section className="rounded-lg border border-neutral-200 dark:border-line p-4 w-full min-w-0 box-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-paper">Чат</h2>
          <Link href="/messages" className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-paper">
            Все →
          </Link>
        </div>

        {conversations.length === 0 ? (
          <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
            Пока нет диалогов. Напишите кому-нибудь со страницы профиля или компании.
          </p>
        ) : (
          <div className="mt-3 space-y-3 min-w-0">
            {conversations.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="flex items-start gap-2.5 min-w-0 w-full rounded-lg p-1.5 -m-1.5 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
              >
                <Avatar initials={c.initials} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-neutral-900 dark:text-paper">{c.name}</div>
                  <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">{c.preview}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
