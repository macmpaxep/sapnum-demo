"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/feed",
    label: "Лента",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 10.5 12 4l8 6.5" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 9.5V20h12V9.5" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/catalog",
    label: "Каталог",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="7" height="7" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
        <rect x="13" y="4" width="7" height="7" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
        <rect x="4" y="13" width="7" height="7" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
        <rect x="13" y="13" width="7" height="7" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
      </svg>
    ),
  },
  {
    href: "/messages",
    label: "Сообщения",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
        <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
      </svg>
    ),
  },
  {
    href: "/dashboard",
    label: "Профиль",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
        <path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                active ? "text-neutral-900" : "text-neutral-400"
              }`}
            >
              {tab.icon(active)}
              <span className="text-[10px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
