"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = {
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
      industry: (form.elements.namedItem("industry") as HTMLInputElement)
        .value,
    };

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Не удалось отправить заявку");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Что-то пошло не так");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-gain px-4 py-3 text-sm text-gain">
        Заявка принята. Мы свяжемся с вами по указанному email.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className="mb-1 block text-xs text-mute">
            Название компании
          </label>
          <input
            id="company"
            name="company"
            required
            className="w-full border border-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-gain"
            placeholder="ООО «Ромашка»"
          />
        </div>
        <div>
          <label htmlFor="industry" className="mb-1 block text-xs text-mute">
            Отрасль
          </label>
          <input
            id="industry"
            name="industry"
            required
            className="w-full border border-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-gain"
            placeholder="Розничная торговля"
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-xs text-mute">
          Рабочий email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full border border-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-gain"
          placeholder="you@company.com"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-gain px-6 py-3 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "loading" ? "Отправляем…" : "Оставить заявку"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-400">{errorMsg}</p>
      )}
    </form>
  );
}
