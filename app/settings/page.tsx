import Link from "next/link";
import { redirect } from "next/navigation";
import TopBar from "@/components/demo/TopBar";
import MobileTabBar from "@/components/demo/MobileTabBar";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("telegram_username, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-white text-neutral-900 overflow-x-hidden">
      <TopBar />
      <div className="mx-auto max-w-[560px] px-4 md:px-6 py-10 pb-24 md:pb-10 space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Настройки</h1>
          <p className="mt-1 text-sm text-neutral-500">Аккаунт и подключённые сервисы.</p>
        </div>

        <div className="border border-neutral-200 p-4">
          <div className="text-xs text-neutral-500">Способ входа</div>
          <div className="mt-1 text-sm text-neutral-900">
            {profile?.telegram_username ? `Telegram @${profile.telegram_username}` : "Telegram"}
          </div>
        </div>

        <div className="border border-neutral-200 p-4">
          <div className="text-xs text-neutral-500">Дата регистрации</div>
          <div className="mt-1 text-sm text-neutral-900">
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("ru-RU") : "—"}
          </div>
        </div>

        <Link href="/profile" className="inline-block text-sm text-neutral-700 underline">
          ← Редактировать анкетные данные
        </Link>
      </div>
      <MobileTabBar />
    </div>
  );
}
