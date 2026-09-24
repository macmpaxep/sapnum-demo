"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ThreadComposer({ conversationId, initialText = "" }: { conversationId: string; initialText?: string }) {
  const [text, setText] = useState(initialText);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) {
      setError("Файл слишком большой (макс. 15 МБ)");
      e.target.value = "";
      return;
    }
    setFile(f);
    setFilePreview(URL.createObjectURL(f));
  }

  function clearFile() {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !file) return;

    setError(null);
    let mediaUrl: string | undefined;

    if (file) {
      setUploading(true);
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setUploading(false);
        setError("Войдите, чтобы прикреплять файлы");
        return;
      }
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${authUser.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("post-media").upload(path, file);
      if (uploadError) {
        setUploading(false);
        setError("Не удалось загрузить файл");
        return;
      }
      mediaUrl = supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
    }
    setUploading(false);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, text: trimmed, mediaUrl }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Не удалось отправить сообщение");
      return;
    }

    setText("");
    clearFile();
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-neutral-200 dark:border-line p-3">
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      {filePreview && (
        <div className="relative mb-2 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {file?.type.startsWith("video/") ? (
            <video src={filePreview} className="max-h-24 rounded-lg" />
          ) : (
            <img src={filePreview} alt="" className="max-h-24 rounded-lg" />
          )}
          <button
            type="button"
            onClick={clearFile}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 dark:border-line bg-white dark:bg-panel text-xs text-neutral-600 dark:text-neutral-400"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" id="thread-media-input" />
        <label
          htmlFor="thread-media-input"
          aria-label="Прикрепить файл"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-neutral-200 dark:border-line text-neutral-500 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-mute"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M21 15.5l-5.5-5-9 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </label>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать сообщение…"
          className="flex-1 border border-neutral-300 dark:border-line bg-white dark:bg-panel px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:border-neutral-400"
        />
        <button
          type="submit"
          disabled={isPending || uploading || (!text.trim() && !file)}
          className="border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-4 py-2 text-sm text-white dark:text-ink disabled:opacity-40"
        >
          {uploading ? "Загрузка…" : "Отправить"}
        </button>
      </div>
    </form>
  );
}
