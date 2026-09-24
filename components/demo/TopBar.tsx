"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "./Avatar";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import CreateMenu from "./CreateMenu";
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
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-6 py-3">
        <Link href="/feed" className="font-display text-base font-bold tracking-tight text-neutral-900">
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
                    ? "bg-neutral-100 font-medium text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4 text-neutral-500">
          {!loading && user && (
            <nav className="hidden md:flex items-center gap-1 border-r border-neutral-200 pr-4 mr-1">
              {personalTabs.map((tab) => {
                const active = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-neutral-100 font-medium text-neutral-900"
                        : "text-neutral-500 hover:text-neutral-900"
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
            <Link href="/login" aria-label="Создать" className="hidden md:block hover:text-neutral-900">
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
              className="hidden md:block rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:border-neutral-400"
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
            className="md:hidden text-neutral-700"
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
        <div className="md:hidden border-t border-neutral-100 bg-white px-4 py-3 flex flex-col gap-1">
          {!loading && user && (
            <div className="mb-1 border-b border-neutral-100 pb-2">
              <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Личное</div>
              {personalTabs.map((tab) => {
                const active = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-neutral-100 font-medium text-neutral-900"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          )}

          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-neutral-100 font-medium text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}

          {!loading && user && (
            <div className="mt-1 border-t border-neutral-100 pt-1">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Анкетные данные
              </Link>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Настройки
              </Link>
            </div>
          )}

          {!loading && user && (
            <div className="mt-1 border-t border-neutral-100 pt-1">
              <Link
                href="/feed"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                + Новая запись
              </Link>
              <Link
                href={companySlug ? `/co/${companySlug}?add=1` : "/co/new"}
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                {companySlug ? "+ Товар или услуга" : "+ Создать страницу компании"}
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between px-3 pt-2 mt-1 border-t border-neutral-100 text-neutral-500">
            {!loading && !user && (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm text-neutral-700">
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
  );
}
