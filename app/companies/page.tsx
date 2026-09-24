import Link from "next/link";
import SearchBox from "@/components/people/SearchBox";
import { listCompanies } from "@/lib/companies";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const companies = await listCompanies(q);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-paper">Компании</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Бизнесы, зарегистрированные на SAPNUM.</p>

      <div className="mt-4">
        <SearchBox placeholder="Поиск по названию или отрасли…" />
      </div>

      {companies.length === 0 && <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">Компаний не найдено.</p>}

      <div className="mt-4 divide-y divide-neutral-100 dark:divide-line overflow-hidden rounded-lg border border-neutral-200 dark:border-line">
        {companies.map((c) => (
          <Link key={c.slug} href={`/co/${c.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 dark:border-line bg-neutral-50 dark:bg-panel text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {c.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-neutral-900 dark:text-paper">{c.name}</div>
              <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">{c.industry ?? "—"}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
