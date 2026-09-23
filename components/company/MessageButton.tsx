"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function MessageButton({ otherUserId }: { otherUserId: string }) {
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
    router.push(`/messages/${data.conversationId}`);
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:border-neutral-400 disabled:opacity-40"
      >
        Написать
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
