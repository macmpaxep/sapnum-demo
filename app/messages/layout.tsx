import type { Metadata } from "next";
import TopBar from "@/components/demo/TopBar";
import MobileTabBar from "@/components/demo/MobileTabBar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Сообщения",
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900 overflow-x-hidden">
      <TopBar />
      <div className="mx-auto max-w-[900px] pb-24 md:pb-6">{children}</div>
      <MobileTabBar />
    </div>
  );
}
