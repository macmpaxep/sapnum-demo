import TopBar from "@/components/demo/TopBar";
import MobileTabBar from "@/components/demo/MobileTabBar";

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900 overflow-x-hidden">
      <TopBar />
      <div className="mx-auto max-w-[700px] px-4 md:px-6 py-6 pb-24 md:pb-6">{children}</div>
      <MobileTabBar />
    </div>
  );
}
