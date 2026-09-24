"use client";

import { useState } from "react";

const TYPE_LABELS: Record<string, string> = {
  partnership: "Партнёрство",
  distributor: "Стать дистрибьютором",
  commercial_offer: "Коммерческое предложение",
  investment: "Инвестиции",
};

export default function ApplicationForm({
  companyId,
  allowInvestment,
  defaultMessage = "",
  triggerLabel = "Подать заявку",
}: {
  companyId: string;
  allowInvestment: boolean;
  defaultMessage?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("partnership");
  const visibleTypes = Object.entries(TYPE_LABELS).filter(([value]) => value !== "investment" || allowInvestment);
  const [message, setMessage] = useState(defaultMessage);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        type,
        message,
        amount: type === "investment" && amount ? Number(amount) : undefined,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error === "Не авторизован" ? "Войдите, чтобы подать заявку" : data.error ?? "Не удалось отправить заявку");
      return;
    }

    setSuccess(true);
    setMessage("");
    setAmount("");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800"
      >
        {triggerLabel}
      </button>
    );
  }

  if (success) {
    return (
      <div className="border border-neutral-200 dark:border-neutral-800 p-4 text-sm text-neutral-700 dark:text-neutral-300">
        Заявка отправлена. Владелец компании увидит её в разделе «Заявки».
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
      <div>
        <label className="text-xs text-neutral-500 dark:text-neutral-400">Тип заявки</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 block w-full border border-neutral-300 dark:border-neutral-700 px-2 py-1.5 text-sm"
        >
          {visibleTypes.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {type === "investment" && (
        <div>
          <label className="text-xs text-neutral-500 dark:text-neutral-400">Сумма ($, опционально)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full border border-neutral-300 dark:border-neutral-700 px-2 py-1.5 text-sm"
            placeholder="150000"
          />
        </div>
      )}

      <div>
        <label className="text-xs text-neutral-500 dark:text-neutral-400">
          {type === "investment" ? "Сообщение (краткий бизнес-план, условия)" : "Сообщение"}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          className="mt-1 block w-full border border-neutral-300 dark:border-neutral-700 px-2 py-1.5 text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          Отправить
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400">
          Отмена
        </button>
      </div>
    </form>
  );
}
