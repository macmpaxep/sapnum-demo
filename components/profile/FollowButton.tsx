"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function FollowButton({ userId, initiallyFollowed }: { userId: string; initiallyFollowed: boolean }) {
  const [following, setFollowing] = useState(initiallyFollowed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  async function toggle() {
    setLoading(true);
    setError(null);
    const next = !following;
    const res = await fetch(`/api/follow/${userId}`, { method: next ? "POST" : "DELETE" });
    setLoading(false);

    if (res.status === 401) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!res.ok) {
      setError("Не удалось выполнить действие");
      return;
    }

    setFollowing(next);
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`border px-4 py-2 text-sm disabled:opacity-40 ${
          following
            ? "border-neutral-300 text-neutral-700 hover:border-red-300 hover:text-red-600"
            : "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800"
        }`}
      >
        {following ? "Отписаться" : "Подписаться"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
