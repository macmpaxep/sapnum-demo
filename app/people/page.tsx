import SearchBox from "@/components/people/SearchBox";
import PersonRow from "@/components/people/PersonRow";
import { listPeople } from "@/lib/profiles";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const people = await listPeople(q);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-paper">Люди</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Предприниматели, инвесторы и участники сообщества SAPNUM.</p>

      <div className="mt-4">
        <SearchBox placeholder="Поиск по имени или юзернейму…" />
      </div>

      {people.length === 0 && <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">Никого не найдено.</p>}

      <div className="mt-4 divide-y divide-neutral-100 dark:divide-line overflow-hidden rounded-lg border border-neutral-200 dark:border-line">
        {people.map((p) => (
          <PersonRow key={p.id} person={p} />
        ))}
      </div>
    </div>
  );
}
