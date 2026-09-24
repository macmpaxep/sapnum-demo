"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { topics } from "@/lib/demo-data";

export default function TopicsSidebar() {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTopic = searchParams.get("topic");

  // На десктопе открыто по умолчанию, на мобильном — закрыто
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    setOpen(isDesktop);
  }, []);

  // На мобильном выбор темы должен сразу сворачивать гармошку — иначе
  // список тем закрывает всю ленту и приходится сворачивать вручную.
  //
  // router.refresh() здесь обязателен: у Next.js клиентская навигация по
  // <Link> при смене только query-параметра на той же странице иногда
  // отдаёт закэшированный рендер (лента без фильтра), хотя URL меняется
  // верно. Явный refresh форсирует новый запрос данных с сервера.
  function handleSelect() {
    if (window.innerWidth < 1024) setOpen(false);
    router.refresh();
  }

  return (
    <aside className="rounded-lg border border-neutral-200 dark:border-line">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Темы
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={`text-neutral-400 dark:text-neutral-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul className="border-t border-neutral-100 dark:border-line px-4 pb-3 pt-1 space-y-1">
          <li>
            <Link
              href="/feed"
              onClick={handleSelect}
              className={`block rounded px-2 py-1.5 text-sm ${
                !activeTopic ? "bg-neutral-100 dark:bg-line font-medium text-neutral-900 dark:text-paper" : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              }`}
            >
              Все темы
            </Link>
          </li>
          {topics.map((topic) => (
            <li key={topic}>
              <Link
                href={`/feed?topic=${encodeURIComponent(topic)}`}
                onClick={handleSelect}
                className={`block rounded px-2 py-1.5 text-sm ${
                  activeTopic === topic ? "bg-neutral-100 dark:bg-line font-medium text-neutral-900 dark:text-paper" : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                }`}
              >
                {topic}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
