"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Avatar from "./Avatar";
import { useUser } from "@/lib/hooks/useUser";
import { openComposer } from "@/lib/composerEvents";

// Just the teaser row on the feed — clicking it (or "Опубликовать")
// opens PostComposerModal, Threads-style, instead of expanding inline.
export default function PostComposer() {
  const { user, loading } = useUser();
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
        <button
          onClick={openComposer}
          className="flex-1 rounded-lg border border-neutral-200 dark:border-line px-3 py-2 text-left text-sm text-neutral-400 dark:text-neutral-500 hover:border-neutral-300 dark:hover:border-mute"
        >
          Что нового?
        </button>
        <button
          onClick={openComposer}
          className="hidden shrink-0 rounded-lg border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-4 py-1.5 text-xs text-white dark:text-ink sm:block"
        >
          Опубликовать
        </button>
      </div>
    </div>
  );
}
