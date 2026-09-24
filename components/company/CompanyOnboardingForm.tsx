"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INDUSTRIES = [
  "IT и разработка ПО",
  "SaaS и облачные сервисы",
  "Финтех и платежи",
  "E-commerce и маркетплейсы",
  "Ритейл и торговля",
  "Оптовая торговля и дистрибуция",
  "Производство",
  "Строительство и недвижимость",
  "Логистика и транспорт",
  "Сельское хозяйство и агробизнес",
  "Энергетика и добыча",
  "Промышленное оборудование",
  "Маркетинг и реклама",
  "Медиа и контент",
  "Образование и EdTech",
  "Здравоохранение и медицина",
  "HR и рекрутинг",
  "Консалтинг",
  "Юридические услуги",
  "Бухгалтерия и аудит",
  "Банки и страхование",
  "Инвестиции и венчур",
  "HoReCa (кафе, рестораны, отели)",
  "Туризм и путешествия",
  "Красота и здоровье",
  "Мода и одежда",
  "Спорт и фитнес",
  "Автомобильная отрасль",
  "Телеком и связь",
  "Другое",
];

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
          className="mt-1 block w-full border border-neutral-300 dark:border-line px-3 py-2 text-sm"
          placeholder="NurTech"
        />
      </div>

      <div>
        <label className="text-xs text-neutral-500 dark:text-neutral-400">Отрасль</label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="mt-1 block w-full border border-neutral-300 dark:border-line bg-white dark:bg-panel px-3 py-2 text-sm"
        >
          <option value="">Выберите отрасль…</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-neutral-500 dark:text-neutral-400">Сайт</label>
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="mt-1 block w-full border border-neutral-300 dark:border-line px-3 py-2 text-sm"
          placeholder="https://example.com"
        />
      </div>

      <div>
        <label className="text-xs text-neutral-500 dark:text-neutral-400">Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full border border-neutral-300 dark:border-line px-3 py-2 text-sm"
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
