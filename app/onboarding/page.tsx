import { redirect } from "next/navigation";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { getCurrentUser } from "@/lib/auth";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.onboardingCompleted) redirect("/feed");

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-panel px-4 py-10 text-neutral-900 dark:text-paper">
      <OnboardingWizard user={user} />
    </div>
  );
}
