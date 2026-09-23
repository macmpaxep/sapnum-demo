"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface TelegramAuthResult {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Telegram appends the signed user payload to return_to as
// `#tgAuthResult=<base64url JSON>` (same format telegram-widget.js parses).
function readTgAuthResult(): TelegramAuthResult | null {
  const match = window.location.hash.match(/[#?&]tgAuthResult=([A-Za-z0-9\-_=]*)$/);
  if (!match) return null;
  // Strip the payload from the URL so a refresh/back doesn't replay it.
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  try {
    let data = match[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = data.length % 4;
    if (pad > 1) data += "=".repeat(4 - pad);
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

// Full-page redirect to Telegram OAuth instead of the official widget.
// The widget loads an iframe and then opens a popup, which is slow to appear
// on iOS Safari and on Android Chrome turns into a detached tab that can't
// hand the result back to the site. A same-tab redirect avoids both.
// The bot must have this site's domain set via @BotFather → /setdomain.
export default function TelegramLoginButton({ botId, next = "/feed" }: { botId: string | null; next?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "redirecting" | "verifying">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = readTgAuthResult();
    if (!user) return;

    setStatus("verifying");
    (async () => {
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Ошибка авторизации");

        const supabase = createSupabaseBrowserClient();
        // generateLink() on the server returns a pre-hashed token meant for
        // the token_hash param — passing it as `token` (the raw 6-digit OTP
        // param) makes Supabase treat it as garbage and reject it as expired/invalid.
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.tokenHash,
          type: "magiclink",
        });
        if (verifyError) throw verifyError;

        router.replace(next);
        router.refresh();
      } catch (err) {
        console.error("[telegram-auth]", err);
        setError(err instanceof Error ? err.message : "Не удалось войти через Telegram");
        setStatus("idle");
      }
    })();
  }, [router]);

  function startLogin() {
    if (!botId) return;
    setError(null);
    setStatus("redirecting");
    const origin = window.location.origin;
    const params = new URLSearchParams({
      bot_id: botId,
      origin,
      request_access: "write",
      return_to: `${origin}/login?next=${encodeURIComponent(next)}`,
    });
    window.location.href = `https://oauth.telegram.org/auth?${params}`;
  }

  if (!botId) {
    return <p className="text-xs text-red-600">Telegram-авторизация не настроена</p>;
  }

  const busy = status !== "idle";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={startLogin}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-[#54a9eb] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#4a9bd9] disabled:opacity-70"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
          <path d="M21.94 4.3 18.7 19.6c-.24 1.08-.88 1.35-1.79.84l-4.94-3.64-2.38 2.3c-.26.26-.48.48-.99.48l.35-5.03 9.15-8.27c.4-.35-.09-.55-.62-.2L6.17 13.2l-4.87-1.52c-1.06-.33-1.08-1.06.22-1.57L20.55 2.8c.88-.33 1.65.2 1.39 1.5Z" />
        </svg>
        {status === "verifying" ? "Входим…" : status === "redirecting" ? "Открываем Telegram…" : "Войти через Telegram"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
