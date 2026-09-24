"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompanyOnboardingForm() {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry, website, description }),
    });

    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Не удалось создать компанию");
      if (data.slug) router.push(`/co/${data.slug}`);
      return;
    }

    router.push(`/co/${data.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-neutral-500 dark:text-neutral-400">Название компании *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
          placeholder="NurTech"
        />
      </div>

      <div>
        <label className="text-xs text-neutral-500 dark:text-neutral-400">Отрасль</label>
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="mt-1 block w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
          placeholder="Логистика / SaaS"
        />
      </div>

      <div>
        <label className="text-xs text-neutral-500 dark:text-neutral-400">Сайт</label>
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="mt-1 block w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
          placeholder="https://example.com"
        />
      </div>

      <div>
        <label className="text-xs text-neutral-500 dark:text-neutral-400">Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
          placeholder="Чем занимается компания, какие продукты или услуги предлагает…"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        {submitting ? "Создаём…" : "Создать страницу компании"}
      </button>
    </form>
  );
}
