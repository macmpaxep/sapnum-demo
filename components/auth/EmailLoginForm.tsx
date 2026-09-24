"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function EmailLoginForm({ next = "/feed" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });

    if (signInError) {
      setError(signInError.message);
      setStatus("idle");
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Мы отправили ссылку для входа на <span className="font-medium text-neutral-900 dark:text-paper">{email}</span>. Откройте почту и перейдите по ней.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="border border-neutral-300 dark:border-line px-3 py-2 text-sm text-neutral-900 dark:text-paper outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-neutral-400"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-4 py-2 text-sm text-white dark:text-ink disabled:opacity-40"
      >
        {status === "sending" ? "Отправляем…" : "Получить ссылку на почту"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
