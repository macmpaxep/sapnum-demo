import { redirect } from "next/navigation";
import TopBar from "@/components/demo/TopBar";
import MobileTabBar from "@/components/demo/MobileTabBar";
import ProfileForm from "@/components/profile/ProfileForm";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("profiles").select("bio").eq("id", user.id).single();

  return (
    <div className="min-h-screen bg-white text-neutral-900 overflow-x-hidden dark:bg-neutral-950 dark:text-neutral-100">
      <TopBar />
      <div className="mx-auto max-w-[560px] px-4 md:px-6 py-10 pb-24 md:pb-10">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Анкетные данные</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">ФИО, юзернейм, фото и роли — видны другим пользователям.</p>
        <div className="mt-6">
          <ProfileForm user={user} bio={profile?.bio ?? ""} />
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
}
