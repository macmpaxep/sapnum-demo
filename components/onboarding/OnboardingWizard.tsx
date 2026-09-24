"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/demo/Avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { topics } from "@/lib/demo-data";
import type { CurrentUser } from "@/lib/auth";

const GOALS = [
  { value: "investors", label: "Найти инвесторов" },
  { value: "orders", label: "Найти заказы и клиентов" },
  { value: "partners", label: "Найти партнёров" },
  { value: "brand", label: "Развивать личный бренд" },
  { value: "other", label: "Пока просто смотрю" },
];

const TOTAL_STEPS = 3;

export default function OnboardingWizard({ user }: { user: CurrentUser }) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [goal, setGoal] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setAvatarUrl(`${publicUrl.publicUrl}?t=${Date.now()}`);
    } catch {
      setError("Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }

  function toggleInterest(t: string) {
    setInterests((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function goNext() {
    setError(null);
    if (step === 1 && !displayName.trim()) {
      setError("Укажите ваше имя");
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    handleFinish();
  }

  async function handleFinish() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl || undefined,
        goal,
        interests,
        onboardingCompleted: true,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSaving(false);
      setError(data.error ?? "Не удалось сохранить");
      return;
    }
    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex justify-center gap-1.5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <span key={i} className={`h-1.5 w-8 rounded-full ${i < step ? "bg-neutral-900 dark:bg-paper" : "bg-neutral-200 dark:bg-line"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="text-center">
          <h1 className="text-lg font-semibold">Добро пожаловать в SAPNUM</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Добавьте фото и укажите, как вас зовут</p>

          <div className="mt-6 flex flex-col items-center gap-3">
            <label htmlFor="onboarding-avatar" className="cursor-pointer">
              <Avatar initials={initials || "?"} size={88} imageUrl={avatarUrl ?? undefined} />
            </label>
            <input id="onboarding-avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            <label htmlFor="onboarding-avatar" className="text-xs text-neutral-500 dark:text-neutral-400 underline cursor-pointer">
              {uploading ? "Загрузка…" : "Добавить фото"}
            </label>
          </div>

          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Имя и фамилия"
            className="mt-6 w-full rounded-lg border border-neutral-300 dark:border-line px-3 py-2.5 text-sm outline-none focus:border-neutral-500"
          />
        </div>
      )}

      {step === 2 && (
        <div className="text-center">
          <h1 className="text-lg font-semibold">Что вы ищете на платформе?</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Поможет показывать вам более релевантное</p>

          <div className="mt-6 space-y-2">
            {GOALS.map((g) => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={`block w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                  goal === g.value
                    ? "border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper text-white dark:text-ink"
                    : "border-neutral-200 dark:border-line text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-mute"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center">
          <h1 className="text-lg font-semibold">Какие темы вам интересны?</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Можно выбрать несколько — необязательно</p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => toggleInterest(t)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  interests.includes(t)
                    ? "border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper text-white dark:text-ink"
                    : "border-neutral-200 dark:border-line text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-mute"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-center text-xs text-red-600">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-paper">
            Назад
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={goNext}
          disabled={saving || uploading}
          className="rounded-lg border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-6 py-2 text-sm text-white dark:text-ink disabled:opacity-40"
        >
          {step < TOTAL_STEPS ? "Далее" : saving ? "Сохраняем…" : "Готово"}
        </button>
      </div>
    </div>
  );
}
