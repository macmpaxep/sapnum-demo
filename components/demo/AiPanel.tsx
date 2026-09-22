"use client";

import { useState } from "react";

const suggestions = ["Почему упала маржа?", "Сравни с конкурентами"];

export default function AiPanel() {
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

  return (
    <section className="border border-neutral-200 p-4">
      <h2 className="text-sm font-semibold text-neutral-900">
        ИИ-ассистент
      </h2>
      <p className="mt-1 text-xs text-neutral-500">Задайте ваш вопрос</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="mt-3 w-full border border-neutral-300 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500"
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
            className="cursor-pointer border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 hover:border-neutral-400"
          >
            {s}
          </button>
        ))}
      </div>

      {loading && <p className="mt-3 text-xs text-neutral-400">Думаю…</p>}
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {answer && (
        <p className="mt-3 border-t border-neutral-100 pt-3 text-sm leading-relaxed text-neutral-700">
          {answer}
        </p>
      )}
    </section>
  );
}
