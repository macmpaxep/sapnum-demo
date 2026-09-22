"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { topics } from "@/lib/demo-data";

export default function PostComposer() {
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("Файл слишком большой (макс. 8 МБ)");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
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

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-200 p-4">
      <div className="flex items-start gap-3">
        <Avatar initials="ВЫ" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напишите что-нибудь…"
          className="flex-1 border-b border-neutral-200 pb-2 text-sm text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
        />
        <button
          type="submit"
          disabled={isPending || uploading || (!text.trim() && !imageFile)}
          className="shrink-0 border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-xs text-white disabled:opacity-40"
        >
          {uploading ? "Загрузка…" : "Опубликовать"}
        </button>
      </div>

      {imagePreview && (
        <div className="mt-3 pl-[44px]">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="" className="max-h-40 border border-neutral-200" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-xs text-neutral-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 pl-0 sm:pl-[44px] text-xs text-neutral-400">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="post-image-input" />
        <label
          htmlFor="post-image-input"
          className="cursor-pointer border border-neutral-200 px-2 py-1 hover:border-neutral-400 hover:text-neutral-700"
        >
          Фото
        </label>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="border border-neutral-200 bg-white px-2 py-1 text-neutral-600"
        >
          <option value="">Без темы</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-2 pl-0 sm:pl-[44px] text-xs text-red-600">{error}</p>}
    </form>
  );
}
