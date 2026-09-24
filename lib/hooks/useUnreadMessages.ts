"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Same computation NotificationBell already does for its message badge —
// factored out so MobileTabBar can show the same count as a small dot,
// without pulling in the whole notifications dropdown.
export function useUnreadMessages(userId: string | undefined) {
  const [count, setCount] = useState(0);
  const conversationIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    async function load() {
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("user_id", userId);

      for (const p of participants ?? []) conversationIds.current.add(p.conversation_id);
      if (!participants || participants.length === 0) return;

      let total = 0;
      for (const p of participants) {
        const { count: c } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", p.conversation_id)
          .neq("sender_id", userId)
          .gt("created_at", p.last_read_at ?? "1970-01-01");
        total += c ?? 0;
      }
      if (!cancelled) setCount(total);
    }

    load();

    const channel = supabase
      .channel(`unread-messages-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        if (payload.new.sender_id === userId) return;
        if (!conversationIds.current.has(payload.new.conversation_id)) return;
        setCount((c) => c + 1);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return count;
}
