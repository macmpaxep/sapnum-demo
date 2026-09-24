"use client";

import { useState } from "react";

const suggestions = ["Почему упала маржа?", "Сравни с конкурентами"];

export default function AiPanel({ compact = false }: { compact?: boolean } = {}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setAnswer(null);

    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: trimmed }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Не удалось получить ответ");
      return;
    }
    setAnswer(data.answer);
  }

  if (compact) {
    return (
      <section className="rounded-lg border border-neutral-200 dark:border-line p-2.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="flex items-center gap-2"
        >
          <span className="shrink-0 text-xs font-medium text-neutral-500 dark:text-neutral-400">ИИ:</span>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-w-0 flex-1 border border-neutral-300 dark:border-line px-2 py-1 text-xs outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-neutral-500"
            placeholder="Спросите про свои показатели…"
          />
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuestion(s);
                ask(s);
              }}
              className="hidden shrink-0 cursor-pointer border border-neutral-200 dark:border-line px-2 py-1 text-[11px] text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-mute md:block"
            >
              {s}
            </button>
          ))}
        </form>
        {(loading || error || answer) && (
          <div className="mt-2 text-xs">
            {loading && <p className="text-neutral-400 dark:text-neutral-500">Думаю…</p>}
            {error && <p className="text-red-600">{error}</p>}
            {answer && <p className="leading-relaxed text-neutral-700 dark:text-neutral-300">{answer}</p>}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-neutral-200 dark:border-line p-4">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-paper">
        ИИ-ассистент
      </h2>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Задайте ваш вопрос</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="mt-3 w-full border border-neutral-300 dark:border-line px-3 py-2 text-sm outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-neutral-500"
          placeholder="Спросите про свои показатели…"
        />
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => {
              setQuestion(s);
              ask(s);
            }}
            className="cursor-pointer border border-neutral-200 dark:border-line px-2.5 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-mute"
          >
            {s}
          </button>
        ))}
      </div>

      {loading && <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">Думаю…</p>}
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {answer && (
        <p className="mt-3 border-t border-neutral-100 dark:border-line pt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {answer}
        </p>
      )}
    </section>
  );
}
