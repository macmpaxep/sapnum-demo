"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ThreadComposer({ conversationId, initialText = "" }: { conversationId: string; initialText?: string }) {
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setError(null);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, text: trimmed }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Не удалось отправить сообщение");
      return;
    }

    setText("");
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-neutral-200 dark:border-line p-3">
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать сообщение…"
          className="flex-1 border border-neutral-300 dark:border-line bg-white dark:bg-panel px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-neutral-400"
        />
        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-4 py-2 text-sm text-white dark:text-ink disabled:opacity-40"
        >
          Отправить
        </button>
      </div>
    </form>
  );
}
