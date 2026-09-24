import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/demo/Avatar";
import ThreadComposer from "@/components/messages/ThreadComposer";
import MessageBubble from "@/components/messages/MessageBubble";
import { getCurrentUser } from "@/lib/auth";
import { getThread, markThreadRead } from "@/lib/messages";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { otherUser, messages } = await getThread(id);
  await markThreadRead(id);

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col md:h-[calc(100vh-56px-2rem)] md:my-4 md:border md:border-neutral-200">
      <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
        <Link href="/messages" className="text-neutral-400 hover:text-neutral-900 md:hidden">
          ←
        </Link>
        {otherUser && <Avatar initials={otherUser.initials} size={32} />}
        <div className="text-sm font-medium text-neutral-900">
          {otherUser?.name ?? "Диалог"}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} id={m.id} body={m.body} isMine={m.senderId === user.id} createdAt={m.createdAt} />
        ))}
        {messages.length === 0 && (
          <p className="text-center text-sm text-neutral-400">Сообщений пока нет</p>
        )}
      </div>

      <ThreadComposer conversationId={id} />
    </div>
  );
}
