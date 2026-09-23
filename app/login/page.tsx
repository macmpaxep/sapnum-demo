import TelegramLoginButton from "@/components/auth/TelegramLoginButton";
import EmailLoginForm from "@/components/auth/EmailLoginForm";

export default function LoginPage() {
  // The bot ID is the numeric prefix of the bot token (it's public — the
  // official widget exposes it too); the secret part never leaves the server.
  const botId = process.env.TELEGRAM_BOT_TOKEN?.split(":")[0] || null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 text-neutral-900">
      <div className="w-full max-w-sm border border-neutral-200 p-8 text-center">
        <div className="font-display text-lg font-bold tracking-tight text-neutral-900">
          SAPNUM
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          Войдите, чтобы продолжить
        </p>
        <div className="mt-6 flex justify-center">
          <TelegramLoginButton botId={botId} />
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200" />
          или по почте
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <EmailLoginForm />
      </div>
    </div>
  );
}
