"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/demo/Avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CurrentUser, UserRole } from "@/lib/auth";

const ROLE_LABELS: Record<UserRole, string> = {
  simple: "Пользователь",
  business: "Бизнес",
  investor: "Инвестор",
  admin: "Админ",
};

export default function ProfileForm({ user, bio: initialBio }: { user: CurrentUser; bio: string }) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("Файл слишком большой (макс. 3 МБ)");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
      const cacheBustedUrl = `${publicUrl.publicUrl}?t=${Date.now()}`;

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: cacheBustedUrl }),
      });
      if (!res.ok) throw new Error("Не удалось сохранить фото");

      setAvatarUrl(cacheBustedUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, username, bio }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Не удалось сохранить");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar initials={initials} size={64} imageUrl={avatarUrl ?? undefined} />
        <label className="cursor-pointer border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600">
          {uploading ? "Загрузка…" : "Изменить фото"}
          <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </label>
      </div>

      <div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">Роли</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {user.roles.length === 0 && <span className="text-sm text-neutral-400 dark:text-neutral-500">—</span>}
          {user.roles.map((r) => (
            <span key={r} className="border border-neutral-200 dark:border-neutral-800 px-2 py-0.5 text-xs text-neutral-600 dark:text-neutral-400">
              {ROLE_LABELS[r]}
            </span>
          ))}
        </div>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Роль «Бизнес» добавляется автоматически при создании компании. Роль «Инвестор» подтверждается вручную.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-neutral-500 dark:text-neutral-400">ФИО</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="mt-1 block w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-500 dark:text-neutral-400">Юзернейм</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mt-1 block w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-500 dark:text-neutral-400">О себе</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="mt-1 block w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
            placeholder="Пара слов о том, чем вы занимаетесь"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-green-700">Сохранено</p>}

        <button
          type="submit"
          disabled={saving}
          className="border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
      </form>
    </div>
  );
}
