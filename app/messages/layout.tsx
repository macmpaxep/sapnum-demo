import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TopBar from "@/components/demo/TopBar";
import MobileTabBar from "@/components/demo/MobileTabBar";
import { getCurrentUser } from "@/lib/auth";
import { listConversations } from "@/lib/messages";
import ConversationList from "@/components/messages/ConversationList";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Сообщения",
};

// Threads-style split view: the conversation list stays mounted as a
// sidebar (via a shared layout across /messages and /messages/[id])
// instead of being its own page you navigate away from on desktop.
export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const conversations = await listConversations(user.id);

  return (
    <div className="min-h-screen bg-white text-neutral-900 overflow-x-hidden dark:bg-ink dark:text-neutral-100">
      <TopBar />
      <div className="mx-auto max-w-[900px] pb-24 md:pb-6">
        <div className="flex h-[calc(100vh-56px)] md:h-[calc(100vh-56px-2rem)] md:my-4 md:rounded-xl md:border md:border-neutral-200 dark:md:border-line md:overflow-hidden">
          <ConversationList conversations={conversations} />
          {children}
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
}
