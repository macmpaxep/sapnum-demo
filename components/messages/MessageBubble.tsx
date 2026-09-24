"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DELETE_WINDOW_MS = 15 * 60 * 1000;

export default function MessageBubble({
  id,
  body,
  isMine,
  createdAt,
}: {
  id: string;
  body: string;
  isMine: boolean;
  createdAt: string;
}) {
  const [deleted, setDeleted] = useState(false);
  const router = useRouter();
  const canDelete = isMine && Date.now() - new Date(createdAt).getTime() < DELETE_WINDOW_MS;

  async function handleDelete() {
    if (!confirm("Удалить сообщение?")) return;
    const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleted(true);
      router.refresh();
    }
  }

  if (deleted) return null;

  return (
    <div className={`group flex items-center gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
      {canDelete && (
        <button
          onClick={handleDelete}
          className="hidden shrink-0 text-xs text-neutral-400 dark:text-neutral-500 hover:text-red-600 group-hover:block"
          aria-label="Удалить сообщение"
        >
          ✕
        </button>
      )}
      <div
        className={`max-w-[75%] px-3 py-2 text-sm ${
          isMine ? "bg-neutral-900 text-white" : "border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
        }`}
      >
        {body}
      </div>
    </div>
  );
}
