import Link from "next/link";
import Avatar from "@/components/demo/Avatar";
import type { DirectoryPerson } from "@/lib/profiles";

const ROLE_LABELS: Record<string, string> = {
  simple: "Пользователь",
  business: "Бизнес",
  investor: "Инвестор",
  admin: "Админ",
};

export default function PersonRow({ person }: { person: DirectoryPerson }) {
  const initials = person.displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <Link href={`/u/${person.username}`} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900">
      <Avatar initials={initials} size={40} imageUrl={person.avatarUrl ?? undefined} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">{person.displayName}</div>
        <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
          @{person.username}
          {person.roles.length > 0 && ` · ${person.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ")}`}
        </div>
      </div>
    </Link>
  );
}
