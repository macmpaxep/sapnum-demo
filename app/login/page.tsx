import TelegramLoginButton from "@/components/auth/TelegramLoginButton";
import EmailLoginForm from "@/components/auth/EmailLoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // The bot ID is the numeric prefix of the bot token (it's public — the
  // official widget exposes it too); the secret part never leaves the server.
  const botId = process.env.TELEGRAM_BOT_TOKEN?.split(":")[0] || null;

  const { next } = await searchParams;
  // Only ever redirect to a relative in-app path — "//evil.com" or an
  // absolute URL would be an open-redirect vector via this query param.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/feed";

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-panel px-4 text-neutral-900 dark:text-paper">
      <div className="w-full max-w-sm border border-neutral-200 dark:border-line p-8 text-center">
        <div className="font-display text-lg font-bold tracking-tight text-neutral-900 dark:text-paper">
          SAPNUM
        </div>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Войдите, чтобы продолжить
        </p>
        <div className="mt-6 flex justify-center">
          <TelegramLoginButton botId={botId} next={safeNext} />
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
          <div className="h-px flex-1 bg-neutral-200" />
          или по почте
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <EmailLoginForm next={safeNext} />
      </div>
    </div>
  );
}
