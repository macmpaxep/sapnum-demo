"use client";

import { useEffect, useRef, useState } from "react";
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

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthResult) => void;
  }
}

// Renders Telegram's official login widget and completes the Supabase
// session exchange once Telegram redirects back with signed user data.
// Requires NEXT_PUBLIC_TELEGRAM_BOT_USERNAME (bot must have a configured
// login domain, set via @BotFather → /setdomain).
export default function TelegramLoginButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
    if (!botUsername || !containerRef.current) return;

    window.onTelegramAuth = async (user: TelegramAuthResult) => {
      setError(null);
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const data = await res.json();
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

        router.push("/feed");
        router.refresh();
      } catch (err) {
        console.error("[telegram-auth]", err);
        setError(err instanceof Error ? err.message : "Не удалось войти через Telegram");
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "20");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    containerRef.current.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Telegram's iframe paints dark corners outside its rounded pill when
          the visitor's OS is in dark mode — clip them with our own mask. */}
      <div ref={containerRef} className="inline-flex overflow-hidden rounded-full leading-none [&>iframe]:block" />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
