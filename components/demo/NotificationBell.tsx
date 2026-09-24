"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const TYPE_TEXT: Record<string, string> = {
  like: "лайкнул(а) вашу запись",
  comment: "прокомментировал(а) вашу запись",
  repost: "сделал(а) репост вашей записи",
  quote: "процитировал(а) вашу запись",
  follow: "подписался(ась) на вас",
};

interface ActivityRow {
  id: string;
  type: string;
  created_at: string;
  read_at: string | null;
  actor: { display_name: string; username: string } | null;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const myConversationIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("activities")
        .select("id, type, created_at, read_at, actor:profiles!activities_actor_id_fkey(display_name, username)")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(15);

      if (cancelled) return;
      const rows = (data ?? []) as unknown as ActivityRow[];
      setItems(rows);
      setUnreadCount(rows.filter((r) => !r.read_at).length);

      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", userId);

      for (const p of participants ?? []) myConversationIds.current.add(p.conversation_id);

      if (participants && participants.length > 0) {
        let total = 0;
        for (const p of participants) {
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", p.conversation_id)
            .neq("sender_id", userId)
            .gt("created_at", p.last_read_at ?? "1970-01-01");
          total += count ?? 0;
        }
        if (!cancelled) setUnreadMessages(total);
      }
    }

    load();

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities", filter: `recipient_id=eq.${userId}` },
        async (payload) => {
          const { data: actor } = await supabase
            .from("profiles")
            .select("display_name, username")
            .eq("id", payload.new.actor_id)
            .single();
          setItems((prev) => [
            { id: payload.new.id, type: payload.new.type, created_at: payload.new.created_at, read_at: null, actor },
            ...prev,
          ]);
          setUnreadCount((c) => c + 1);
        }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        if (payload.new.sender_id === userId) return;
        if (!myConversationIds.current.has(payload.new.conversation_id)) return;
        setUnreadMessages((c) => c + 1);
      })
      .subscribe();

    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [userId]);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("activities").update({ read_at: new Date().toISOString() }).eq("recipient_id", userId).is("read_at", null);
      setUnreadCount(0);
      setItems((prev) => prev.map((i) => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })));
    }
  }

  function timeAgo(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diffMs / 3_600_000);
    if (hours < 1) return "только что";
    if (hours < 24) return `${hours} ч назад`;
    return `${Math.floor(hours / 24)} дн назад`;
  }

  const totalBadge = unreadCount + unreadMessages;

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen} aria-label="Уведомления" className="relative hover:text-neutral-900 dark:hover:text-paper">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {totalBadge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-80 rounded-lg border border-neutral-200 dark:border-line bg-white dark:bg-panel py-1 shadow-lg">
          {unreadMessages > 0 && (
            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="block border-b border-neutral-100 dark:border-line px-3 py-2 text-sm text-neutral-900 dark:text-paper hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              💬 {unreadMessages} новых сообщений
            </Link>
          )}
          {items.length === 0 && <p className="px-3 py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">Пока нет уведомлений</p>}
          <div className="max-h-96 overflow-y-auto">
            {items.map((a) => (
              <div key={a.id} className="px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <span className="font-medium text-neutral-900 dark:text-paper">{a.actor?.display_name ?? "Пользователь"}</span>{" "}
                <span className="text-neutral-600 dark:text-neutral-400">{TYPE_TEXT[a.type] ?? a.type}</span>
                <div className="text-xs text-neutral-400 dark:text-neutral-500">{timeAgo(a.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
