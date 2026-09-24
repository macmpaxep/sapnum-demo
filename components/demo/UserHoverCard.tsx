"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Avatar from "./Avatar";

const ROLE_LABELS: Record<string, string> = {
  simple: "Пользователь",
  business: "Бизнес",
  investor: "Инвестор",
  admin: "Админ",
};

interface MiniProfile {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  roles: string[];
  followerCount: number;
}

// Threads-style: hovering (or tapping, on touch) a username loads and shows
// a small profile card instead of forcing a full navigation just to see
// who someone is.
export default function UserHoverCard({ username, children }: { username: string; children: React.ReactNode }) {
  const [profile, setProfile] = useState<MiniProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  async function load() {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${username}`);
      if (res.ok) setProfile(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => {
        setOpen(true);
        load();
      }}
      onMouseLeave={() => setOpen(false)}
    >
      <Link href={`/u/${username}`} onClick={() => setOpen(false)} onFocus={() => { setOpen(true); load(); }} onBlur={() => setOpen(false)}>
        {children}
      </Link>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-64 rounded-lg border border-neutral-200 dark:border-line bg-white dark:bg-panel p-3 shadow-lg">
          {loading && !profile && <p className="text-xs text-neutral-400 dark:text-neutral-500">Загрузка…</p>}
          {profile && (
            <Link href={`/u/${profile.username}`} className="block" onClick={() => setOpen(false)}>
              <div className="flex items-center gap-2.5">
                <Avatar initials={profile.displayName.split(" ").map((w) => w[0]).join("")} size={36} imageUrl={profile.avatarUrl ?? undefined} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-neutral-900 dark:text-paper">{profile.displayName}</div>
                  <div className="truncate text-xs text-neutral-400 dark:text-neutral-500">@{profile.username}</div>
                </div>
              </div>
              {profile.bio && <p className="mt-2 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">{profile.bio}</p>}
              <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                <span>{profile.followerCount} подписчиков</span>
                {profile.roles[0] && <span>{ROLE_LABELS[profile.roles[0]] ?? profile.roles[0]}</span>}
              </div>
            </Link>
          )}
        </div>
      )}
    </span>
  );
}
