"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "./Avatar";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import CreateMenu from "./CreateMenu";
import ThemeToggle from "./ThemeToggle";
import PostComposerModal from "./PostComposerModal";
import { useUser } from "@/lib/hooks/useUser";
import { useMyCompany } from "@/lib/hooks/useMyCompany";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const baseTabs = [
  { label: "Лента", href: "/feed" },
  { label: "Каталог", href: "/catalog" },
  { label: "Люди", href: "/people" },
  { label: "Компании", href: "/companies" },
];

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useUser();
  const companySlug = useMyCompany(user?.id);

  const tabs = baseTabs;
  const personalTabs = [
    ...(companySlug ? [{ label: "Дашборд", href: "/dashboard" }] : []),
    { label: "Сообщения", href: "/messages" },
  ];

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white dark:border-line dark:bg-ink">
      <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-6 py-3">
        <Link href="/feed" className="font-display text-base font-bold tracking-tight text-neutral-900 dark:text-paper dark:text-paper">
          SAPNUM
        </Link>

        {/* Десктоп навигация */}
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-neutral-100 font-medium text-neutral-900 dark:bg-line dark:text-paper"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-paper dark:text-neutral-400 dark:hover:text-paper"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4 text-neutral-500 dark:text-neutral-400 dark:text-neutral-400">
          <ThemeToggle className="hidden md:block" />

          {!loading && user && (
            <nav className="hidden md:flex items-center gap-1 border-r border-neutral-200 dark:border-line pr-4 mr-1 dark:border-line">
              {personalTabs.map((tab) => {
                const active = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-neutral-100 dark:bg-line font-medium text-neutral-900 dark:text-paper"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-paper"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {!loading && user ? (
            <div className="hidden md:block">
              <CreateMenu companySlug={companySlug} />
            </div>
          ) : (
            <Link href="/login" aria-label="Создать" className="hidden md:block hover:text-neutral-900 dark:hover:text-paper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </Link>
          )}

          {!loading && user && <NotificationBell userId={user.id} />}

          {!loading && !user && (
            <Link
              href="/login"
              className="hidden md:block rounded-md border border-neutral-300 dark:border-line px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-mute"
            >
              Войти
            </Link>
          )}

          {!loading && user && (
            <div className="hidden md:block">
              <UserMenu user={user} />
            </div>
          )}

          {loading && <Avatar initials="…" size={30} />}

          {/* Бургер — только мобильный */}
          <button
            className="md:hidden text-neutral-700 dark:text-neutral-300"
            aria-label="Меню"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      {menuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white px-4 py-3 flex flex-col gap-1 dark:border-line dark:bg-ink">
          <div className="flex items-center justify-between px-3 pb-2 mb-1 border-b border-neutral-100 dark:border-line dark:border-line">
            <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Тема</span>
            <ThemeToggle />
          </div>

          {!loading && user && companySlug && (
            <div className="mb-1 border-b border-neutral-100 dark:border-line pb-2 dark:border-line">
              <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Личное</div>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-neutral-100 dark:bg-line font-medium text-neutral-900 dark:text-paper"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
                }`}
              >
                Дашборд
              </Link>
            </div>
          )}

          {/* Лента/Каталог/Сообщения уже есть в нижней панели — здесь только то,
              для чего там не нашлось места. */}
          {[
            { label: "Люди", href: "/people" },
            { label: "Компании", href: "/companies" },
          ].map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-neutral-100 dark:bg-line font-medium text-neutral-900 dark:text-paper"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-paper"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}

          {!loading && user && (
            <div className="mt-1 border-t border-neutral-100 dark:border-line pt-1">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
              >
                Анкетные данные
              </Link>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
              >
                Настройки
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between px-3 pt-2 mt-1 border-t border-neutral-100 dark:border-line text-neutral-500 dark:text-neutral-400">
            {!loading && !user && (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm text-neutral-700 dark:text-neutral-300">
                Войти
              </Link>
            )}
            {!loading && user && (
              <button onClick={handleLogout} className="text-sm text-red-600">
                Выйти
              </button>
            )}
          </div>
        </div>
      )}
    </header>
    <PostComposerModal />
    </>
  );
}
