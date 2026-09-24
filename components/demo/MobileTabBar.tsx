"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";

const staticTabs = [
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
    href: "/people",
    label: "Люди",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="2.6" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
        <path d="M4 19c.8-3 3-4.6 5-4.6s4.2 1.6 5 4.6" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
        <circle cx="17" cy="9" r="2.1" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
        <path d="M15.2 14.6c1.8.4 3.2 1.7 3.8 4" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
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
];

const profileIcon = (active: boolean) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
    <path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round" />
  </svg>
);

export default function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useUser();
  const unreadMessages = useUnreadMessages(user?.id);
  const profileHref = user ? `/u/${user.username}` : "/login";

  const tabs = [...staticTabs, { href: profileHref, label: "Профиль", icon: profileIcon }];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-line dark:bg-ink">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                active ? "text-neutral-900 dark:text-paper" : "text-neutral-400 dark:text-neutral-500"
              }`}
            >
              <span className="relative">
                {tab.icon(active)}
                {tab.href === "/messages" && unreadMessages > 0 && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </span>
              <span className="text-[10px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
