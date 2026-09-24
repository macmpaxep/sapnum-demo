"use client";

import { useState } from "react";

export default function ImproveTextButton({
  text,
  onImproved,
  className = "",
}: {
  text: string;
  onImproved: (improved: string) => void;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/improve-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Не удалось улучшить текст");
      return;
    }

    onImproved(data.improved);
  }

  return (
    <span className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || !text.trim()}
        className="text-xs text-neutral-500 dark:text-neutral-400 underline hover:text-neutral-900 dark:hover:text-white disabled:opacity-40 disabled:no-underline"
      >
        {loading ? "Улучшаем…" : "✨ Улучшить с ИИ"}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </span>
  );
}
