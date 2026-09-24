"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "./Avatar";
import type { FeedPost } from "@/lib/queries";
import { haptic } from "@/lib/haptics";
import { useUser } from "@/lib/hooks/useUser";

type Comment = { id: string; body: string; created_at: string; author_id: string; profiles: { display_name: string } | null };

const EDIT_WINDOW_MS = 15 * 60 * 1000;

export default function PostCard({ post, linkToPost = true }: { post: FeedPost; linkToPost?: boolean }) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(post.savedByMe);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(post.repostCount);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [content, setContent] = useState(post.content);
  const [deleted, setDeleted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reported, setReported] = useState(false);
  const [threadText, setThreadText] = useState("");
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useUser();

  const canEdit = post.isMine && Date.now() - new Date(post.createdAt).getTime() < EDIT_WINDOW_MS;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) setShareMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function toggleLike() {
    const next = !liked;
    if (next) haptic();
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    const res = await fetch(`/api/posts/${post.id}/like`, { method: next ? "POST" : "DELETE" });
    if (!res.ok) {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
      setError("Войдите, чтобы ставить лайки");
    }
  }

  async function toggleSave() {
    const next = !saved;
    setSaved(next);
    const res = await fetch(`/api/posts/${post.id}/save`, { method: next ? "POST" : "DELETE" });
    if (!res.ok) {
      setSaved(!next);
      setError("Войдите, чтобы сохранять записи");
    }
  }

  async function handleRepost() {
    const res = await fetch(`/api/posts/${post.id}/repost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      setReposted(true);
      setRepostCount((c) => c + 1);
    } else {
      setError("Войдите, чтобы репостить");
    }
  }

  async function loadComments() {
    setShowComments((v) => !v);
    if (comments === null) {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    }
  }

  async function postComment(rawText: string) {
    const text = rawText.trim();
    if (!text) return false;
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [...(prev ?? []), { ...data.comment, profiles: { display_name: "Вы" } }]);
      setCommentCount((c) => c + 1);
      return true;
    }
    setError("Войдите, чтобы комментировать");
    return false;
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (await postComment(commentText)) setCommentText("");
  }

  async function submitThread(e: React.FormEvent) {
    e.preventDefault();
    if (!showComments) {
      setShowComments(true);
      if (comments === null) {
        const res = await fetch(`/api/posts/${post.id}/comments`);
        if (res.ok) setComments((await res.json()).comments ?? []);
      }
    }
    if (await postComment(threadText)) setThreadText("");
  }

  function copyLink() {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
    setMenuOpen(false);
  }

  async function submitEdit() {
    const text = editText.trim();
    if (!text) return;
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setContent(text);
      setEditing(false);
    } else {
      setError(data.error ?? "Не удалось сохранить изменения");
    }
  }

  async function handleDelete() {
    if (!confirm("Удалить запись?")) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setDeleted(true);
      router.refresh();
    } else {
      setError(data.error ?? "Не удалось удалить запись");
    }
    setMenuOpen(false);
  }

  if (deleted || hidden) return null;

  function handleReport() {
    fetch(`/api/posts/${post.id}/report`, { method: "POST" }).catch(() => {});
    setReported(true);
    setMenuOpen(false);
  }

  function handleCardClick(e: React.MouseEvent<HTMLElement>) {
    if (!linkToPost) return;
    const target = e.target as HTMLElement;
    if (target.closest("a, button, textarea, input, form")) return;
    router.push(post.catalogItemId ? `/item/${post.catalogItemId}` : `/post/${post.id}`);
  }

  return (
    <article
      onClick={handleCardClick}
      className={`rounded-lg border border-neutral-200 dark:border-line p-4 ${linkToPost ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center gap-3">
        {post.authorUsername ? (
          <Link href={`/u/${post.authorUsername}`}>
            <Avatar initials={post.author.split(" ").map((w) => w[0]).join("")} />
          </Link>
        ) : (
          <Avatar initials={post.author.split(" ").map((w) => w[0]).join("")} />
        )}
        <div className="min-w-0 flex-1">
          {post.authorUsername ? (
            <Link href={`/u/${post.authorUsername}`} className="text-sm font-medium text-neutral-900 dark:text-paper hover:underline">
              {post.author}
            </Link>
          ) : (
            <div className="text-sm font-medium text-neutral-900 dark:text-paper">{post.author}</div>
          )}
          <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {post.companySlug ? (
              <Link href={`/co/${post.companySlug}`} className="hover:underline hover:text-neutral-700 dark:hover:text-neutral-200">
                {post.role}
              </Link>
            ) : (
              post.role
            )}
          </div>
        </div>
        <div className="shrink-0 flex items-start gap-2 text-right text-xs text-neutral-400 dark:text-neutral-500">
          <div>
            <div>{post.topic}</div>
            <div>{post.time}</div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Ещё"
              className="rounded-md px-1.5 py-1 text-neutral-400 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-paper hover:text-neutral-700 dark:hover:text-ink"
            >
              •••
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-48 rounded-lg border border-neutral-200 dark:border-line bg-white dark:bg-panel py-1 text-left shadow-lg">
                {canEdit ? (
                  <>
                    <button
                      onClick={() => {
                        setEditing(true);
                        setMenuOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
                    >
                      Редактировать
                    </button>
                    <button onClick={handleDelete} className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink">
                      Удалить
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setHidden(true);
                        setMenuOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
                    >
                      Скрыть запись
                    </button>
                    <button
                      onClick={handleReport}
                      disabled={reported}
                      className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink disabled:opacity-40"
                    >
                      {reported ? "Жалоба отправлена" : "Пожаловаться"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="block w-full border border-neutral-300 dark:border-line px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button onClick={submitEdit} className="border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-3 py-1.5 text-xs text-white dark:text-ink">
              Сохранить
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditText(content);
              }}
              className="px-3 py-1.5 text-xs text-neutral-500 dark:text-neutral-400"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        content && <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{content}</p>
      )}

      {post.mediaUrls.length > 0 && (
        <div className={`mt-3 grid gap-2 ${post.mediaUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {post.mediaUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className={`w-full rounded-lg border border-neutral-100 dark:border-line object-cover ${
                post.mediaUrls.length > 1 ? "aspect-square" : "max-h-96"
              }`}
            />
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex items-center gap-5 border-t border-neutral-100 dark:border-line pt-3 text-xs text-neutral-500 dark:text-neutral-400">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-paper ${liked ? "text-red-500 dark:text-red-500 font-medium" : ""}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"}>
            <path
              d="M12 20.3c-.3 0-.6-.1-.8-.3C7.7 17 4 13.5 4 9.7 4 7 6.1 4.8 8.8 4.8c1.4 0 2.7.6 3.2 1.6.5-1 1.8-1.6 3.2-1.6C17.9 4.8 20 7 20 9.7c0 3.8-3.7 7.3-7.2 10.3-.2.2-.5.3-.8.3Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          {likeCount > 0 ? likeCount : ""}
        </button>
        <button onClick={loadComments} className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-paper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 5h16v11H8l-4 4V5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          {commentCount > 0 ? commentCount : ""}
        </button>
        <button
          onClick={handleRepost}
          disabled={reposted}
          className={`flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-paper ${reposted ? "text-neutral-900 dark:text-paper font-medium" : ""}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 8h9a3 3 0 0 1 3 3v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M9 5 6 8l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 16H9a3 3 0 0 1-3-3v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M15 19l3-3-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {repostCount > 0 ? repostCount : ""}
        </button>
        <div className="relative ml-auto" ref={shareMenuRef}>
          <button
            onClick={() => setShareMenuOpen((v) => !v)}
            aria-label="Поделиться"
            className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-paper"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 15V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M8 8l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {shareMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-56 rounded-lg border border-neutral-200 dark:border-line bg-white dark:bg-panel py-1 text-left shadow-lg">
              <button
                onClick={() => {
                  copyLink();
                  setShareMenuOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
              >
                {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${content.slice(0, 100)} ${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareMenuOpen(false)}
                className="block w-full px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
              >
                Переслать в WhatsApp
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.id}`)}&text=${encodeURIComponent(content.slice(0, 100))}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareMenuOpen(false)}
                className="block w-full px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
              >
                Переслать в Telegram
              </a>
              <button
                onClick={() => {
                  toggleSave();
                  setShareMenuOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-paper dark:hover:text-ink"
              >
                {saved ? "Убрать из сохранённого" : "Сохранить"}
              </button>
            </div>
          )}
        </div>
      </div>


      {user?.id === post.authorId && (
        <div className="relative mt-3 flex items-center gap-3 border-t border-neutral-100 dark:border-line pt-3">
          <span className="absolute left-[17px] top-0 h-3 w-px bg-neutral-200 dark:bg-line" />
          <Avatar initials={post.author.split(" ").map((w) => w[0]).join("")} size={28} />
          <form onSubmit={submitThread} className="flex-1">
            <input
              value={threadText}
              onChange={(e) => setThreadText(e.target.value)}
              placeholder="Дополните ветку"
              className="w-full border-0 bg-transparent text-sm text-neutral-400 dark:bg-transparent dark:text-neutral-500 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
          </form>
        </div>
      )}

      {showComments && (
        <div className="mt-3 space-y-3 border-t border-neutral-100 dark:border-line pt-3">
          {comments?.map((c) => {
            const isThread = c.author_id === post.authorId;
            return (
              <div key={c.id} className={`flex items-start gap-2.5 text-xs ${isThread ? "border-l-2 border-neutral-200 dark:border-line pl-2.5" : ""}`}>
                <Avatar initials={(c.profiles?.display_name ?? "?").split(" ").map((w) => w[0]).join("")} size={22} />
                <div>
                  <span className="font-medium text-neutral-900 dark:text-paper">{c.profiles?.display_name ?? "Пользователь"}</span>{" "}
                  {isThread && <span className="text-neutral-400 dark:text-neutral-500">· продолжение ветки</span>}
                  <div className="text-neutral-600 dark:text-neutral-400">{c.body}</div>
                </div>
              </div>
            );
          })}
          <form onSubmit={submitComment} className="flex gap-2 pt-1">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Написать комментарий…"
              className="flex-1 border border-neutral-200 dark:border-line px-2 py-1.5 text-xs outline-none focus:border-neutral-400"
            />
            <button type="submit" className="border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-3 py-1.5 text-xs text-white dark:text-ink">
              Отправить
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
