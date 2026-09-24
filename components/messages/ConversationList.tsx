"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@/components/demo/Avatar";
import type { ConversationSummary } from "@/lib/messages";

export default function ConversationList({ conversations }: { conversations: ConversationSummary[] }) {
  const pathname = usePathname();
  const activeId = pathname.startsWith("/messages/") ? pathname.split("/")[2] : null;
  const isListRoute = pathname === "/messages";
  const [tab, setTab] = useState<"inbox" | "requests">("inbox");

  const inbox = conversations.filter((c) => !c.isRequest);
  const requests = conversations.filter((c) => c.isRequest);
  const shown = tab === "inbox" ? inbox : requests;

  return (
    <div className={`w-full shrink-0 border-neutral-200 dark:border-line md:w-80 md:border-r ${isListRoute ? "block" : "hidden md:block"}`}>
      <h1 className="px-4 pt-4 text-lg font-semibold text-neutral-900 dark:text-paper md:px-4">Сообщения</h1>

      <div className="mt-3 flex gap-2 px-4">
        <button
          onClick={() => setTab("inbox")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            tab === "inbox" ? "bg-neutral-900 dark:bg-paper text-white dark:text-ink" : "bg-neutral-100 dark:bg-line text-neutral-600 dark:text-neutral-400"
          }`}
        >
          Входящие
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            tab === "requests" ? "bg-neutral-900 dark:bg-paper text-white dark:text-ink" : "bg-neutral-100 dark:bg-line text-neutral-600 dark:text-neutral-400"
          }`}
        >
          Запросы{requests.length > 0 ? ` (${requests.length})` : ""}
        </button>
      </div>

      {shown.length === 0 && (
        <p className="px-4 py-6 text-sm text-neutral-400 dark:text-neutral-500">
          {tab === "inbox" ? "Пока нет диалогов." : "Нет новых запросов."}
        </p>
      )}

      <div className="mt-2 divide-y divide-neutral-100 dark:divide-line">
        {shown.map((c) => (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            className={`group flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-paper ${
              activeId === c.id ? "bg-neutral-50 dark:bg-line" : ""
            }`}
          >
            <Avatar initials={c.initials} size={44} imageUrl={c.avatarUrl ?? undefined} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-neutral-900 dark:text-paper dark:group-hover:text-ink">{c.name}</div>
              <div className="truncate text-xs text-neutral-500 dark:text-neutral-400 dark:group-hover:text-ink">{c.preview}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
