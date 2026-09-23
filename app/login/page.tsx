import TelegramLoginButton from "@/components/auth/TelegramLoginButton";

export default function LoginPage() {
  // The bot ID is the numeric prefix of the bot token (it's public — the
  // official widget exposes it too); the secret part never leaves the server.
  const botId = process.env.TELEGRAM_BOT_TOKEN?.split(":")[0] || null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm border border-neutral-200 p-8 text-center">
        <div className="font-display text-lg font-bold tracking-tight text-neutral-900">
          SAPNUM
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          Войдите через Telegram, чтобы продолжить
        </p>
        <div className="mt-6 flex justify-center">
          <TelegramLoginButton botId={botId} />
        </div>
      </div>
    </div>
  );
}
