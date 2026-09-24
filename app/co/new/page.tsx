import { redirect } from "next/navigation";
import TopBar from "@/components/demo/TopBar";
import MobileTabBar from "@/components/demo/MobileTabBar";
import CompanyOnboardingForm from "@/components/company/CompanyOnboardingForm";
import { getCurrentUser } from "@/lib/auth";
import { getCompanySlugForUser } from "@/lib/companies";

export default async function NewCompanyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existingSlug = await getCompanySlugForUser(user.id);
  if (existingSlug) redirect(`/co/${existingSlug}`);

  return (
    <div className="min-h-screen bg-white text-neutral-900 overflow-x-hidden">
      <TopBar />
      <div className="mx-auto max-w-[560px] px-4 md:px-6 py-10 pb-24 md:pb-10">
        <h1 className="text-lg font-semibold text-neutral-900">Расскажите о своей компании</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Вы ещё не заполнили анкету компании — без неё нельзя принимать заявки, вести дашборд и публиковать записи от имени компании.
        </p>
        <div className="mt-6">
          <CompanyOnboardingForm />
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
}
