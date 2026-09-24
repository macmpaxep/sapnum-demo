"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CurrentUser } from "@/lib/auth";

export default function UserMenu({ user }: { user: CurrentUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  const initials = user.displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-label="Меню профиля">
        <Avatar initials={initials} size={30} imageUrl={user.avatarUrl ?? undefined} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-56 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-1 shadow-lg">
          <div className="border-b border-neutral-100 dark:border-neutral-800 px-3 py-2">
            <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">{user.displayName}</div>
            <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">@{user.username}</div>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            Анкетные данные
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            Настройки
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full border-t border-neutral-100 dark:border-neutral-800 px-3 py-2 text-left text-sm text-red-600 hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            Выход
          </button>
        </div>
      )}
    </div>
  );
}
