"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FollowButton({ userId, initiallyFollowed }: { userId: string; initiallyFollowed: boolean }) {
  const [following, setFollowing] = useState(initiallyFollowed);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    const next = !following;
    const res = await fetch(`/api/follow/${userId}`, { method: next ? "POST" : "DELETE" });
    setLoading(false);

    if (!res.ok) {
      router.push("/login");
      return;
    }

    setFollowing(next);
    router.refresh();
  }

  return (
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
  );
}
