"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

function isVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)$/i.test(url);
}

export default function MessageBubble({
  id,
  body,
  mediaUrl,
  isMine,
  createdAt,
}: {
  id: string;
  body: string;
  mediaUrl: string | null;
  isMine: boolean;
  createdAt: string;
}) {
  const [deleted, setDeleted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(body);
  const [text, setText] = useState(body);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const canManage = isMine && Date.now() - new Date(createdAt).getTime() < EDIT_WINDOW_MS;

  async function handleDelete() {
    if (!confirm("Удалить сообщение?")) return;
    const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleted(true);
      router.refresh();
    }
  }

  async function handleEditSave() {
    const trimmed = editText.trim();
    if (!trimmed) return;
    const res = await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Не удалось сохранить");
      return;
    }
    setText(trimmed);
    setEditing(false);
    setError(null);
    router.refresh();
  }

  if (deleted) return null;

  return (
    <div className={`group flex items-center gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
      {canManage && !editing && (
        <div className="hidden shrink-0 items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-hover:flex">
          <button onClick={() => setEditing(true)} className="hover:text-neutral-900 dark:hover:text-paper" aria-label="Редактировать сообщение">
            ✎
          </button>
          <button onClick={handleDelete} className="hover:text-red-600" aria-label="Удалить сообщение">
            ✕
          </button>
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
          isMine
            ? "bg-neutral-900 text-white dark:bg-paper dark:text-ink"
            : "border border-neutral-200 dark:border-line text-neutral-700 dark:text-neutral-300"
        }`}
      >
        {mediaUrl &&
          (isVideo(mediaUrl) ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={mediaUrl} controls className="mb-1.5 max-h-64 rounded-lg" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt="" className="mb-1.5 max-h-64 rounded-lg" />
          ))}
        {editing ? (
          <div className="space-y-1.5">
            <input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full rounded-lg border-0 bg-white/10 px-2 py-1 text-sm outline-none"
              autoFocus
            />
            <div className="flex gap-2 text-xs">
              <button onClick={handleEditSave} className="underline">
                Сохранить
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditText(text);
                  setError(null);
                }}
                className="opacity-70 underline"
              >
                Отмена
              </button>
            </div>
            {error && <p className="text-red-400">{error}</p>}
          </div>
        ) : (
          text && <span>{text}</span>
        )}
      </div>
    </div>
  );
}
