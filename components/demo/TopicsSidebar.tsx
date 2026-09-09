import { topics } from "@/lib/demo-data";

export default function TopicsSidebar() {
  return (
    <aside className="border border-neutral-200 p-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        Темы
      </h2>
      <ul className="mt-3 space-y-1">
        {topics.map((topic) => (
          <li key={topic}>
            <button className="block w-full rounded px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50">
              {topic}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
