import Avatar from "./Avatar";
import { chatContacts, conversations } from "@/lib/demo-data";

export default function Chat() {
  return (
    <aside className="flex flex-col gap-6 min-w-0 overflow-hidden">
<section className="border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Чат</h2>

        <div className="mt-3 flex items-center gap-2">
          {chatContacts.map((c) => (
            <Avatar key={c.initials} initials={c.initials} size={30} />
          ))}
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-dashed border-neutral-300 text-neutral-400">
            +
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {conversations.map((c) => (
            <div key={c.name} className="flex items-start gap-2.5">
              <Avatar initials={c.initials} size={32} />
              <div className="min-w-0">
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