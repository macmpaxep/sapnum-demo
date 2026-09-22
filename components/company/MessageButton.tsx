"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MessageButton({ otherUserId }: { otherUserId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId }),
    });
    setLoading(false);

    if (!res.ok) {
      router.push("/login");
      return;
    }

    const data = await res.json();
    router.push(`/messages/${data.conversationId}`);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:border-neutral-400 disabled:opacity-40"
    >
      Написать
    </button>
  );
}
