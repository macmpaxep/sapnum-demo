import type { Metadata } from "next";
import TopBar from "@/components/demo/TopBar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Демо приложения",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900 overflow-x-hidden">
      <TopBar />
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-6">{children}</div>
    </div>
  );
}

