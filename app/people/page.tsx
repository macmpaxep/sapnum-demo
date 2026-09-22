import Link from "next/link";
import Avatar from "@/components/demo/Avatar";
import SearchBox from "@/components/people/SearchBox";
import { listPeople } from "@/lib/profiles";

const ROLE_LABELS: Record<string, string> = {
  simple: "Пользователь",
  business: "Бизнес",
  investor: "Инвестор",
  admin: "Админ",
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const people = await listPeople(q);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">Люди</h1>
      <p className="mt-1 text-sm text-neutral-500">Предприниматели, инвесторы и участники сообщества SAPNUM.</p>

      <div className="mt-4">
        <SearchBox placeholder="Поиск по имени или юзернейму…" />
      </div>

      {people.length === 0 && <p className="mt-6 text-sm text-neutral-500">Никого не найдено.</p>}

      <div className="mt-4 divide-y divide-neutral-100 border border-neutral-200">
        {people.map((p) => {
          const initials = p.displayName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join("");
          return (
            <Link key={p.id} href={`/u/${p.username}`} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
              <Avatar initials={initials} size={40} imageUrl={p.avatarUrl ?? undefined} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-900">{p.displayName}</div>
                <div className="truncate text-xs text-neutral-500">
                  @{p.username}
                  {p.roles.length > 0 && ` · ${p.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ")}`}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
