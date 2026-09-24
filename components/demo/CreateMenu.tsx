"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { openComposer } from "@/lib/composerEvents";

export default function CreateMenu({
  companySlug,
  direction = "down",
  align = "right",
  renderTrigger,
}: {
  companySlug: string | null;
  direction?: "down" | "up";
  align?: "right" | "center";
  renderTrigger?: (onClick: () => void) => React.ReactNode;
}) {
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
      {renderTrigger ? (
        renderTrigger(() => setOpen((v) => !v))
      ) : (
        <button onClick={() => setOpen((v) => !v)} aria-label="Создать" className="hover:text-neutral-900 dark:hover:text-paper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      )}

      {open && (
        <div
          className={`absolute z-20 w-56 max-w-[calc(100vw-2rem)] rounded-lg border border-neutral-200 dark:border-line bg-white dark:bg-panel py-1 shadow-lg ${
            direction === "up" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
          } ${align === "center" ? "left-1/2 -translate-x-1/2" : "right-0"}`}
        >
          <button
            onClick={() => {
              setOpen(false);
              openComposer();
            }}
            className="block w-full px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
          >
            Новая запись
          </button>
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
