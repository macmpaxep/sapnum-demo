"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { checkImageDimensions, checkPhotoQualitySoft, MIN_IMAGE_DIMENSION } from "@/lib/imageQuality";
import ImproveTextButton from "@/components/ai/ImproveTextButton";
import Link from "next/link";
import { useUser } from "@/lib/hooks/useUser";
import { useMyCompany } from "@/lib/hooks/useMyCompany";
import { listenForComposerOpen, registerComposerTextarea } from "@/lib/composerEvents";
import { topics } from "@/lib/demo-data";

// Threads-style: writing happens in a focused full-screen (mobile) /
// centered (desktop) modal instead of an inline field competing with
// the feed for attention, opened from anywhere via openComposer().
export default function PostComposerModal() {
  const { user } = useUser();
  const companySlug = useMyCompany(user?.id);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => listenForComposerOpen(() => setOpen(true)), []);

  // Registering the textarea lets openComposer() call .focus() synchronously
  // inside the triggering click, which is what actually raises the iOS
  // keyboard — see the comment in composerEvents.ts. The modal itself stays
  // mounted (never unmounts to display:none) so the ref is always valid.
  useEffect(() => {
    registerComposerTextarea(textareaRef.current);
    return () => registerComposerTextarea(null);
  }, [user]);

  function reset() {
    setText("");
    setTopic("");
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setQualityWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("Файл слишком большой (макс. 8 МБ)");
      e.target.value = "";
      return;
    }
    setQualityWarning(null);
    try {
      const { ok, width, height } = await checkImageDimensions(file);
      if (!ok) {
        setError(`Фото слишком маленькое (${width}×${height}px) — минимум ${MIN_IMAGE_DIMENSION}×${MIN_IMAGE_DIMENSION}px`);
        e.target.value = "";
        return;
      }
    } catch {
      setError("Не удалось прочитать файл");
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    checkPhotoQualitySoft(file).then((result) => {
      if (!result.ok) setQualityWarning(result.reason ?? "Качество фото вызывает сомнения");
    });
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    setQualityWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !imageFile) return;

    setError(null);
    const mediaUrls: string[] = [];

    try {
      if (imageFile) {
        setUploading(true);
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) throw new Error("Войдите, чтобы прикреплять фото");

        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const path = `${authUser.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("post-media").upload(path, imageFile);
        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage.from("post-media").getPublicUrl(path);
        mediaUrls.push(publicUrl.publicUrl);
      }
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : "Не удалось загрузить файл");
      return;
    }
    setUploading(false);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed, mediaUrls, topic: topic || undefined }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error === "Не авторизован" ? "Войдите, чтобы публиковать записи" : data.error ?? "Не удалось опубликовать");
      return;
    }

    close();
    startTransition(() => router.refresh());
  }

  if (!user) return null;

  const initials = user.displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      // Stays in the DOM (never display:none) even while closed, so the
      // textarea below remains focusable — that's what lets openComposer()
      // raise the iOS keyboard synchronously from the triggering click.
      className={`fixed inset-0 z-[60] flex items-end justify-center bg-black/50 transition-opacity duration-200 sm:items-center ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={close}
      aria-hidden={!open}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className={`flex h-[92vh] w-full flex-col rounded-t-xl bg-white dark:bg-ink transition-transform duration-200 sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-2xl sm:translate-y-0 sm:rounded-xl sm:border sm:border-neutral-200 sm:dark:border-line ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-line px-4 py-3">
          <button type="button" onClick={close} className="text-sm text-neutral-500 dark:text-neutral-400">
            Отмена
          </button>
          <span className="text-sm font-semibold text-neutral-900 dark:text-paper">Новая публикация</span>
          <span className="w-12" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4 pt-5">
          <div className="flex items-start gap-3.5">
            <Avatar initials={initials} imageUrl={user.avatarUrl ?? undefined} />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="text-sm font-medium text-neutral-900 dark:text-paper">{user.username}</div>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Что нового?"
                rows={4}
                className="mt-2 block w-full resize-none rounded-lg border-0 bg-neutral-50 dark:bg-panel p-3 text-base text-neutral-900 dark:text-neutral-100 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
              />

              {imagePreview && (
                <div className="relative mt-2 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="" className="max-h-52 rounded-lg border border-neutral-200 dark:border-line" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 dark:border-line bg-white dark:bg-panel text-xs text-neutral-600 dark:text-neutral-400"
                  >
                    ✕
                  </button>
                </div>
              )}

              {text.trim() && (
                <div className="mt-1 text-right">
                  <ImproveTextButton text={text} onImproved={setText} />
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="modal-post-image-input" />
                <label
                  htmlFor="modal-post-image-input"
                  aria-label="Фото"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-neutral-200 dark:border-line text-neutral-500 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-mute hover:text-neutral-900 dark:hover:text-paper"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M21 15.5l-5.5-5-9 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </label>
                <div className="relative flex h-9 items-center rounded-full border border-neutral-200 dark:border-line pl-2.5 pr-6 hover:border-neutral-400 dark:hover:border-mute">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <path
                      d="M4 4h7l9 9-7 7-9-9V4z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <circle cx="8" cy="8" r="1.3" fill="currentColor" />
                  </svg>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="ml-1.5 appearance-none border-0 bg-transparent pr-2 text-xs text-neutral-600 dark:text-neutral-400 outline-none"
                  >
                    <option value="">Выберите тему</option>
                    {topics.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-2">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {qualityWarning && (
                <p className="mt-2 text-xs text-amber-600">⚠ {qualityWarning} — можно опубликовать как есть или заменить фото.</p>
              )}
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-line px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 sm:justify-between sm:pb-3">
          <Link
            href={companySlug ? `/co/${companySlug}?add=1` : "/co/new"}
            onClick={close}
            className="hidden shrink-0 rounded-lg bg-neutral-100 dark:bg-line px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-mute/30 sm:inline-block"
          >
            Опубликовать товар/услугу →
          </Link>
          <button
            type="submit"
            disabled={isPending || uploading || (!text.trim() && !imageFile)}
            className="rounded-lg border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-5 py-2 text-sm text-white dark:text-ink disabled:opacity-40"
          >
            {uploading ? "Загрузка…" : "Опубликовать"}
          </button>
        </div>
      </form>
    </div>
  );
}
