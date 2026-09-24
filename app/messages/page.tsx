import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/demo/Avatar";
import { getCurrentUser } from "@/lib/auth";
import { listConversations } from "@/lib/messages";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const conversations = await listConversations(user.id);

  return (
    <div className="px-4 md:px-6 py-6">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-paper">Сообщения</h1>

      {conversations.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
          Пока нет диалогов. Напишите кому-нибудь со страницы компании или профиля.
        </p>
      )}

      <div className="mt-4 divide-y divide-neutral-100 border border-neutral-200 dark:border-line">
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <Avatar initials={c.initials} size={40} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-neutral-900 dark:text-paper">{c.name}</div>
              <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">{c.preview}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
