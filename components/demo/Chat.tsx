import Avatar from "./Avatar";
import { chatContacts, conversations } from "@/lib/demo-data";

export default function Chat() {
  return (
    <aside className="flex flex-col gap-6 min-w-0 w-full overflow-hidden">
      <section className="border border-neutral-200 p-4 w-full min-w-0 box-border">
        <h2 className="text-sm font-semibold text-neutral-900">Чат</h2>

        {/* Добавлена обертка flex-wrap для контактов, чтобы аватарки не распирали ширину */}
        <div className="mt-3 flex flex-wrap items-center gap-2 min-w-0">
          {chatContacts.map((c) => (
            <Avatar key={c.initials} initials={c.initials} size={30} />
          ))}
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-dashed border-neutral-300 text-neutral-400">
            +
          </div>
        </div>

        <div className="mt-4 space-y-3 min-w-0">
          {conversations.map((c) => (
            /* Добавлен min-w-0 и w-full для каждого элемента диалога */
            <div key={c.name} className="flex items-start gap-2.5 min-w-0 w-full">
              <Avatar initials={c.initials} size={32} />
              {/* min-w-0 обязателен на родителе с truncate */}
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