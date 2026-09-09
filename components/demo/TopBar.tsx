"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Avatar from "./Avatar";

const tabs = [
  { label: "Лента", href: "/demo/feed" },
  { label: "Дашборд", href: "/demo/dashboard" },
  { label: "Каталог", href: "/demo/catalog" },
  { label: "Показатели", href: "/demo/metrics" },
];

export default function TopBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-6 py-3">
        <span className="font-display text-base font-bold tracking-tight text-neutral-900">
          SAPNUM
        </span>

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
          {/* Иконки — скрыты на мобильном */}
          <button aria-label="Сообщения" className="hidden md:block hover:text-neutral-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <button aria-label="Создать" className="hidden md:block hover:text-neutral-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>

          <Avatar initials="ВЫ" size={30} />

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

          {/* Иконки в мобильном меню */}
          <div className="flex gap-4 px-3 pt-2 mt-1 border-t border-neutral-100 text-neutral-500">
            <button aria-label="Сообщения" className="hover:text-neutral-900">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <button aria-label="Создать" className="hover:text-neutral-900">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}