"use client";

import { useState } from "react";
import Avatar from "./Avatar";
import type { FeedPost } from "@/lib/queries";

type Comment = { id: string; body: string; created_at: string; profiles: { display_name: string } | null };

export default function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(post.savedByMe);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [reposted, setReposted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <article className="border border-neutral-200 p-4">
      <div className="flex items-center gap-3">
        <Avatar initials={post.author.split(" ").map((w) => w[0]).join("")} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-neutral-900">{post.author}</div>
          <div className="truncate text-xs text-neutral-500">{post.role}</div>
        </div>
        <div className="shrink-0 text-right text-xs text-neutral-400">
          <div>{post.topic}</div>
          <div>{post.time}</div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-neutral-700">{post.content}</p>

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
          ⟲ {reposted ? "Репостнуто" : "Репост"}
        </button>
        <button
          onClick={toggleSave}
          className={`ml-auto flex items-center gap-1.5 hover:text-neutral-900 ${saved ? "text-neutral-900 font-medium" : ""}`}
        >
          {saved ? "Сохранено" : "Сохранить"}
        </button>
      </div>

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
