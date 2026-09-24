"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function CreateMenu({ companySlug }: { companySlug: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-label="Создать" className="hover:text-neutral-900 dark:hover:text-paper">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-56 rounded-lg border border-neutral-200 dark:border-line bg-white dark:bg-panel py-1 shadow-lg">
          <Link
            href="/feed"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
          >
            Новая запись
          </Link>
          {companySlug ? (
            <Link
              href={`/co/${companySlug}?add=1`}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
            >
              Товар или услуга
            </Link>
          ) : (
            <Link
              href="/co/new"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
            >
              Создать страницу компании
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
