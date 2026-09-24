"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "./Avatar";
import type { FeedPost } from "@/lib/queries";

type Comment = { id: string; body: string; created_at: string; profiles: { display_name: string } | null };

const EDIT_WINDOW_MS = 15 * 60 * 1000;

export default function PostCard({ post }: { post: FeedPost }) {
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
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const canEdit = post.isMine && Date.now() - new Date(post.createdAt).getTime() < EDIT_WINDOW_MS;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function toggleLike() {
    const next = !liked;
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

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [...(prev ?? []), { ...data.comment, profiles: { display_name: "Вы" } }]);
      setCommentCount((c) => c + 1);
      setCommentText("");
    } else {
      setError("Войдите, чтобы комментировать");
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
    setMenuOpen(false);
  }

  async function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, text: content.slice(0, 100) });
      } catch {
        // user cancelled share sheet — no-op
      }
    } else {
      copyLink();
    }
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

  if (deleted) return null;

  return (
    <article className="border border-neutral-200 p-4">
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
            <Link href={`/u/${post.authorUsername}`} className="text-sm font-medium text-neutral-900 hover:underline">
              {post.author}
            </Link>
          ) : (
            <div className="text-sm font-medium text-neutral-900">{post.author}</div>
          )}
          <div className="truncate text-xs text-neutral-500">
            {post.companySlug ? (
              <Link href={`/co/${post.companySlug}`} className="hover:underline hover:text-neutral-700">
                {post.role}
              </Link>
            ) : (
              post.role
            )}
          </div>
        </div>
        <div className="shrink-0 flex items-start gap-2 text-right text-xs text-neutral-400">
          <div>
            <div>{post.topic}</div>
            <div>{post.time}</div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Ещё"
              className="rounded-md px-1.5 py-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
            >
              •••
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-48 border border-neutral-200 bg-white py-1 text-left shadow-lg">
                <button
                  onClick={() => {
                    toggleSave();
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  {saved ? "Убрать из сохранённого" : "Сохранить"}
                </button>
                <button onClick={copyLink} className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50">
                  {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
                </button>
                <button onClick={handleShare} className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50">
                  Поделиться
                </button>
                {canEdit && (
                  <>
                    <button
                      onClick={() => {
                        setEditing(true);
                        setMenuOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      Редактировать
                    </button>
                    <button onClick={handleDelete} className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-neutral-50">
                      Удалить
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
            className="block w-full border border-neutral-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button onClick={submitEdit} className="border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-xs text-white">
              Сохранить
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditText(content);
              }}
              className="px-3 py-1.5 text-xs text-neutral-500"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        content && <p className="mt-3 text-sm leading-relaxed text-neutral-700">{content}</p>
      )}

      {post.mediaUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2">
          {post.mediaUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="max-h-96 w-full border border-neutral-100 object-cover" />
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex items-center gap-5 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 hover:text-neutral-900 ${liked ? "text-neutral-900 font-medium" : ""}`}
        >
          ♥ {likeCount > 0 ? likeCount : ""} Нравится
        </button>
        <button onClick={loadComments} className="flex items-center gap-1.5 hover:text-neutral-900">
          💬 {commentCount > 0 ? commentCount : ""} Комментировать
        </button>
        <button
          onClick={handleRepost}
          disabled={reposted}
          className={`flex items-center gap-1.5 hover:text-neutral-900 ${reposted ? "text-neutral-900 font-medium" : ""}`}
        >
          ⟲ {repostCount > 0 ? repostCount : ""} {reposted ? "Репостнуто" : "Репост"}
        </button>
        <button
          onClick={toggleSave}
          className={`ml-auto flex items-center gap-1.5 hover:text-neutral-900 ${saved ? "text-neutral-900 font-medium" : ""}`}
        >
          {saved ? "Сохранено" : "Сохранить"}
        </button>
      </div>

      {post.viewCount > 0 && <p className="mt-1.5 text-[11px] text-neutral-400">{post.viewCount} просмотров</p>}

      {showComments && (
        <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
          {comments?.map((c) => (
            <div key={c.id} className="text-xs">
              <span className="font-medium text-neutral-900">{c.profiles?.display_name ?? "Пользователь"}</span>{" "}
              <span className="text-neutral-600">{c.body}</span>
            </div>
          ))}
          <form onSubmit={submitComment} className="flex gap-2 pt-1">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Написать комментарий…"
              className="flex-1 border border-neutral-200 px-2 py-1.5 text-xs outline-none focus:border-neutral-400"
            />
            <button type="submit" className="border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-xs text-white">
              Отправить
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
