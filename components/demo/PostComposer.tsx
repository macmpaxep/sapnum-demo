"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";

export default function PostComposer() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setError(null);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error === "Не авторизован" ? "Войдите, чтобы публиковать записи" : data.error ?? "Не удалось опубликовать");
      return;
    }

    setText("");
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-200 p-4">
      <div className="flex items-start gap-3">
        <Avatar initials="ВЫ" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напишите что-нибудь…"
          className="flex-1 border-b border-neutral-200 pb-2 text-sm text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
        />
        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="shrink-0 border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-xs text-white disabled:opacity-40"
        >
          Опубликовать
        </button>
      </div>
      {error && <p className="mt-2 pl-[44px] text-xs text-red-600">{error}</p>}
    </form>
  );
}
