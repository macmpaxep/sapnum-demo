import Avatar from "./Avatar";
import { getChatConversations } from "@/lib/queries";

export default async function Chat() {
  const { contacts, conversations } = await getChatConversations();

  return (
    <aside className="flex flex-col gap-6 min-w-0 w-full overflow-hidden">
      <section className="border border-neutral-200 p-4 w-full min-w-0 box-border">
        <h2 className="text-sm font-semibold text-neutral-900">Чат</h2>

        {/* flex-wrap не даёт аватаркам распирать ширину контейнера */}
        <div className="mt-3 flex flex-wrap items-center gap-2 min-w-0">
          {contacts.map((c) => (
            <Avatar key={c.initials} initials={c.initials} size={30} />
          ))}
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-dashed border-neutral-300 text-neutral-400">
            +
          </div>
        </div>

        <div className="mt-4 space-y-3 min-w-0">
          {conversations.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5 min-w-0 w-full">
              <Avatar initials={c.initials} size={32} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-neutral-900">
                  {c.name}
                </div>
                <div className="truncate text-xs text-neutral-500">
                  {c.preview}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
