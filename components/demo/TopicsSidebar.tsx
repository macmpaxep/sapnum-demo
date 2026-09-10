"use client";

import { useState, useEffect } from "react";
import { topics } from "@/lib/demo-data";

export default function TopicsSidebar() {
  const [open, setOpen] = useState(false);

  // На десктопе открыто по умолчанию, на мобильном — закрыто
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    setOpen(isDesktop);
  }, []);

  return (
    <aside className="border border-neutral-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
          Темы
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={`text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
        <ul className="border-t border-neutral-100 px-4 pb-3 pt-1 space-y-1">
          {topics.map((topic) => (
            <li key={topic}>
              <button className="block w-full rounded px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50">
                {topic}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}