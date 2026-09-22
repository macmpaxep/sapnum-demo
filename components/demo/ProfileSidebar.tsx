"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ProfileMenuItem {
  label: string;
  href: string;
  sub?: { label: string; href: string }[];
}

export default function ProfileSidebar({ items }: { items: ProfileMenuItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="border border-neutral-200 p-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        Мой профиль
      </h2>
      <ul className="mt-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`block rounded px-2 py-1.5 text-sm ${
                  active
                    ? "bg-neutral-100 font-medium text-neutral-900"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {item.label}
              </Link>
              {item.sub && active && (
                <ul className="ml-3 mt-1 space-y-1 border-l border-neutral-200 pl-3">
                  {item.sub.map((sub) => (
                    <li key={sub.label}>
                      <Link
                        href={sub.href}
                        className="block px-2 py-1 text-xs text-neutral-500 hover:text-neutral-900"
                      >
                        {sub.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
