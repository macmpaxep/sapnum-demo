"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ProfileMenuItem } from "./ProfileSidebar";

export default function ProfileTabsHorizontal({ items }: { items: ProfileMenuItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-lg border border-neutral-200 dark:border-line p-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm whitespace-nowrap ${
              active
                ? "bg-neutral-100 dark:bg-line font-medium text-neutral-900 dark:text-paper"
                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
