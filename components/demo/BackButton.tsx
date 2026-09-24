"use client";

import { useRouter } from "next/navigation";

// Mobile-only: on desktop the sidebar nav is always visible, but on
// mobile a drill-in page (profile, item, thread…) has no way back except
// the OS gesture, which isn't obvious to everyone.
export default function BackButton({ label = "Назад" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="md:hidden mb-2 flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-paper"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  );
}
