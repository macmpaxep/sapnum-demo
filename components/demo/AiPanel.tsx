import Avatar from "./Avatar";
import { chatContacts, conversations } from "@/lib/demo-data";

const suggestions = ["Почему упала маржа?", "Сравни с конкурентами"];

export default function AiPanel() {
  return (
    <aside className="flex flex-col gap-6 min-w-0 overflow-hidden">
      <section className="border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          ИИ-ассистент
        </h2>
        <p className="mt-1 text-xs text-neutral-500">Задайте ваш вопрос</p>
        <div className="mt-3 border border-neutral-300 px-3 py-2 text-sm text-neutral-400">
          Спросите про свои показатели…
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <span
              key={s}
              className="cursor-pointer border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 hover:border-neutral-400"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      
    </aside>
  );
}
