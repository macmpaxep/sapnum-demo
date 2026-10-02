"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONTACT_TYPES, MAX_CONTACTS, type CompanyContact, type ContactType } from "@/lib/companyContacts";

interface Props {
  slug: string;
  initial: {
    name: string;
    industry: string | null;
    description: string | null;
    website: string | null;
    bin: string | null;
    contacts: CompanyContact[];
  };
}

const fieldClass =
  "block w-full rounded-lg border border-neutral-300 dark:border-line bg-white dark:bg-panel px-3 py-2 text-sm outline-none focus:border-neutral-500";

export default function CompanyEditor({ slug, initial }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial.name);
  const [industry, setIndustry] = useState(initial.industry ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [website, setWebsite] = useState(initial.website ?? "");
  const [bin, setBin] = useState(initial.bin ?? "");
  const [contacts, setContacts] = useState<CompanyContact[]>(initial.contacts);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(initial.name);
    setIndustry(initial.industry ?? "");
    setDescription(initial.description ?? "");
    setWebsite(initial.website ?? "");
    setBin(initial.bin ?? "");
    setContacts(initial.contacts);
    setError(null);
  }

  function close() {
    reset();
    setOpen(false);
  }

  function updateContact(i: number, patch: Partial<CompanyContact>) {
    setContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/companies/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry, description, website, bin, contacts }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Не удалось сохранить");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-neutral-300 dark:border-line px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-mute"
      >
        ✎ Редактировать
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center" onClick={close}>
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full flex-col rounded-t-xl bg-white dark:bg-ink sm:max-w-xl sm:rounded-xl sm:border sm:border-neutral-200 sm:dark:border-line"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-line px-5 py-3">
              <span className="text-sm font-semibold text-neutral-900 dark:text-paper">Данные компании</span>
              <button type="button" onClick={close} className="text-sm text-neutral-500 dark:text-neutral-400">
                Закрыть
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <label className="block">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Название</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className={`mt-1 ${fieldClass}`} />
                <span className="mt-1 block text-[11px] text-neutral-400 dark:text-neutral-500">Адрес страницы (/co/{slug}) при смене названия не меняется.</span>
              </label>

              <label className="block">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Сфера деятельности</span>
                <input value={industry} onChange={(e) => setIndustry(e.target.value)} maxLength={100} className={`mt-1 ${fieldClass}`} />
              </label>

              <label className="block">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">О компании</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={2000} className={`mt-1 ${fieldClass}`} />
              </label>

              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Сайт</span>
                <div className="mt-1 flex gap-2">
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://company.kz" className={fieldClass} />
                  {website && (
                    <button
                      type="button"
                      onClick={() => setWebsite("")}
                      className="shrink-0 rounded-lg border border-neutral-300 dark:border-line px-3 text-xs text-neutral-500 dark:text-neutral-400 hover:text-red-600"
                    >
                      Убрать
                    </button>
                  )}
                </div>
                <span className="mt-1 block text-[11px] text-neutral-400 dark:text-neutral-500">Пустое поле — ссылка на странице компании не показывается.</span>
              </div>

              <label className="block">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">БИН / ИИН</span>
                <input
                  value={bin}
                  onChange={(e) => setBin(e.target.value.replace(/[^\d]/g, "").slice(0, 12))}
                  inputMode="numeric"
                  placeholder="12 цифр"
                  className={`mt-1 ${fieldClass}`}
                />
              </label>

              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Контакты ({contacts.length}/{MAX_CONTACTS})</span>
                <div className="mt-1 space-y-2">
                  {contacts.map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <select
                        value={c.type}
                        onChange={(e) => updateContact(i, { type: e.target.value as ContactType })}
                        className="w-32 shrink-0 rounded-lg border border-neutral-300 dark:border-line bg-white dark:bg-panel px-2 py-2 text-sm"
                      >
                        {CONTACT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <input
                        value={c.value}
                        onChange={(e) => updateContact(i, { value: e.target.value })}
                        maxLength={120}
                        placeholder={CONTACT_TYPES.find((t) => t.value === c.type)?.placeholder}
                        className={fieldClass}
                      />
                      <button
                        type="button"
                        onClick={() => setContacts((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label="Удалить контакт"
                        className="shrink-0 px-2 text-neutral-400 dark:text-neutral-500 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={contacts.length >= MAX_CONTACTS}
                  onClick={() => setContacts((prev) => [...prev, { type: "phone", value: "" }])}
                  className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 underline hover:text-neutral-900 dark:hover:text-paper disabled:opacity-40"
                >
                  + Добавить контакт
                </button>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-line px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
              <button type="button" onClick={close} className="px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="rounded-lg border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-5 py-2 text-sm text-white dark:text-ink disabled:opacity-40"
              >
                {saving ? "Сохраняем…" : "Сохранить"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
