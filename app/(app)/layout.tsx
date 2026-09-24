import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TopBar from "@/components/demo/TopBar";
import MobileTabBar from "@/components/demo/MobileTabBar";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Демо приложения",
};

export default async function DemoLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user && !user.onboardingCompleted) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-white text-neutral-900 overflow-x-hidden dark:bg-ink dark:text-neutral-100">
      <TopBar />
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-6 pb-24 md:pb-6">{children}</div>
      <MobileTabBar />
    </div>
  );
}

