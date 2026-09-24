"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function MessageButton({
  otherUserId,
  label = "Написать",
  draft,
}: {
  otherUserId: string;
  label?: string;
  draft?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  async function handleClick() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId }),
    });

    setLoading(false);

    if (res.status === 401) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Не удалось открыть диалог");
      return;
    }

    const data = await res.json();
    const query = draft ? `?draft=${encodeURIComponent(draft)}` : "";
    router.push(`/messages/${data.conversationId}${query}`);
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg border border-neutral-300 dark:border-line px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-mute disabled:opacity-40"
      >
        {label}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
