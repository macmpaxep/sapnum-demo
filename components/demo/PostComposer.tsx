"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Avatar from "./Avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { checkImageDimensions, checkPhotoQualitySoft, MIN_IMAGE_DIMENSION } from "@/lib/imageQuality";
import ImproveTextButton from "@/components/ai/ImproveTextButton";
import { useUser } from "@/lib/hooks/useUser";
import { topics } from "@/lib/demo-data";

export default function PostComposer() {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Войдите, чтобы прикреплять фото");

        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
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

    setText("");
    setTopic("");
    clearImage();
    startTransition(() => router.refresh());
  }

  if (loading) {
    return <div className="h-[68px] rounded-lg border border-neutral-200 dark:border-line" />;
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-neutral-200 dark:border-line p-4">
        <div className="flex items-center gap-3">
          <Avatar initials="?" />
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="flex-1 rounded-lg border border-neutral-200 dark:border-line px-3 py-2 text-sm text-neutral-400 dark:text-neutral-500 hover:border-neutral-300 dark:hover:border-mute"
          >
            Войдите, чтобы опубликовать запись…
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-neutral-200 dark:border-line p-4">
      <div className="flex items-start gap-3">
        <Avatar initials="ВЫ" />
        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Напишите что-нибудь…"
            className="block w-full border border-neutral-200 dark:border-line px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-neutral-400"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending || uploading || (!text.trim() && !imageFile)}
              className="border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-4 py-1.5 text-xs text-white dark:text-ink disabled:opacity-40"
            >
              {uploading ? "Загрузка…" : "Опубликовать"}
            </button>
          </div>
        </div>
      </div>

      {text.trim() && (
        <div className="mt-1 pl-0 sm:pl-[44px] text-right">
          <ImproveTextButton text={text} onImproved={setText} />
        </div>
      )}

      {imagePreview && (
        <div className="mt-3 pl-[44px]">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="" className="max-h-40 border border-neutral-200 dark:border-line" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 dark:border-line bg-white dark:bg-panel text-xs text-neutral-600 dark:text-neutral-400"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 pl-0 sm:pl-[44px] text-xs text-neutral-400 dark:text-neutral-500">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="post-image-input" />
        <label
          htmlFor="post-image-input"
          className="cursor-pointer rounded-lg border border-neutral-200 dark:border-line px-2 py-1 hover:border-neutral-400 dark:hover:border-mute hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          Фото
        </label>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="rounded-lg border border-neutral-200 dark:border-line bg-white dark:bg-panel px-2 py-1 text-neutral-600 dark:text-neutral-400"
        >
          <option value="">Без темы</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {qualityWarning && (
        <p className="mt-2 pl-0 sm:pl-[44px] text-xs text-amber-600">
          ⚠ {qualityWarning} — можно опубликовать как есть или заменить фото.
        </p>
      )}
      {error && <p className="mt-2 pl-0 sm:pl-[44px] text-xs text-red-600">{error}</p>}
    </form>
  );
}
