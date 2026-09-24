import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/demo/Avatar";
import FollowButton from "@/components/profile/FollowButton";
import ThreadComposer from "@/components/messages/ThreadComposer";
import MessageBubble from "@/components/messages/MessageBubble";
import { getCurrentUser } from "@/lib/auth";
import { getThread, markThreadRead } from "@/lib/messages";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ draft?: string }>;
}) {
  const { id } = await params;
  const { draft } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { otherUser, messages, accepted, isInitiator, requestMessagesLeft } = await getThread(id);
  await markThreadRead(id);

  const isPendingRequest = !accepted && isInitiator;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-line px-4 py-3">
        <Link href="/messages" className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-paper md:hidden">
          ←
        </Link>
        {otherUser && (
          <Link href={`/u/${otherUser.username}`} className="shrink-0">
            <Avatar initials={otherUser.initials} size={32} imageUrl={otherUser.avatarUrl ?? undefined} />
          </Link>
        )}
        <div className="text-sm font-medium text-neutral-900 dark:text-paper">
          {otherUser?.name ?? "Диалог"}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {otherUser && messages.length === 0 && (
          <div className="flex flex-col items-center py-6 text-center">
            <Avatar initials={otherUser.initials} size={72} imageUrl={otherUser.avatarUrl ?? undefined} />
            <Link href={`/u/${otherUser.username}`} className="mt-3 text-base font-semibold text-neutral-900 dark:text-paper hover:underline">
              {otherUser.name}
            </Link>
            <div className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">@{otherUser.username}</div>
            <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              {otherUser.followerCount} подписчиков
              {!otherUser.isFollowedByMe && !otherUser.isFollowingMe && " · вы не подписаны друг на друга"}
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/u/${otherUser.username}`}
                className="rounded-lg border border-neutral-300 dark:border-line px-4 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-mute"
              >
                Посмотреть профиль
              </Link>
              <FollowButton userId={otherUser.id} initiallyFollowed={otherUser.isFollowedByMe} />
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} id={m.id} body={m.body} mediaUrl={m.mediaUrl} isMine={m.senderId === user.id} createdAt={m.createdAt} />
        ))}
      </div>

      {isPendingRequest && (
        <p className="border-t border-neutral-200 dark:border-line px-4 py-2 text-center text-xs text-neutral-400 dark:text-neutral-500">
          {requestMessagesLeft > 0
            ? `Это запрос на переписку — можно отправить ещё ${requestMessagesLeft} из 3 сообщений, пока ${otherUser?.name ?? "получатель"} не ответит.`
            : "Вы отправили 3 сообщения — дождитесь ответа, прежде чем писать ещё."}
        </p>
      )}

      <ThreadComposer conversationId={id} initialText={draft ?? ""} disabled={isPendingRequest && requestMessagesLeft <= 0} />
    </div>
  );
}
