"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Avatar from "./Avatar";
import CreateMenu from "./CreateMenu";
import { useUser } from "@/lib/hooks/useUser";
import { useMyCompany } from "@/lib/hooks/useMyCompany";

// Just the teaser row on the feed — clicking it (or "Опубликовать") offers
// the same "Новая запись" / "Товар или услуга" choice as the "+" menu,
// instead of jumping straight into PostComposerModal.
export default function PostComposer() {
  const { user, loading } = useUser();
  const companySlug = useMyCompany(user?.id);
  const pathname = usePathname();

  if (loading) {
    return <div className="h-[68px] rounded-lg border border-neutral-200 dark:border-line" />;
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-neutral-200 dark:border-line p-4">
        <div className="flex items-center gap-3">
          <Avatar initials="?" />
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="flex-1 rounded-lg border border-neutral-200 dark:border-line px-3 py-2 text-sm text-neutral-400 dark:text-neutral-500 hover:border-neutral-300 dark:hover:border-mute"
          >
            Войдите, чтобы опубликовать запись…
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-line p-4">
      <div className="flex items-center gap-3">
        <Avatar initials="ВЫ" imageUrl={user.avatarUrl ?? undefined} />
        <div className="flex-1">
          <CreateMenu
            companySlug={companySlug}
            align="left"
            renderTrigger={(onClick) => (
              <button
                onClick={onClick}
                className="w-full rounded-lg border border-neutral-200 dark:border-line px-3 py-2 text-left text-sm text-neutral-400 dark:text-neutral-500 hover:border-neutral-300 dark:hover:border-mute"
              >
                Что нового?
              </button>
            )}
          />
        </div>
        <CreateMenu
          companySlug={companySlug}
          align="right"
          renderTrigger={(onClick) => (
            <button
              onClick={onClick}
              className="hidden shrink-0 rounded-lg border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-4 py-1.5 text-xs text-white dark:text-ink sm:block"
            >
              Опубликовать
            </button>
          )}
        />
      </div>
    </div>
  );
}
