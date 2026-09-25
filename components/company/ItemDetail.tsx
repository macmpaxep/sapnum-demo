"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { checkImageDimensions, checkPhotoQualitySoft, MIN_IMAGE_DIMENSION } from "@/lib/imageQuality";
import ImproveTextButton from "@/components/ai/ImproveTextButton";
import MessageButton from "@/components/company/MessageButton";
import ApplicationForm from "@/components/company/ApplicationForm";
import type { CatalogItem } from "@/lib/catalog";
import type { CatalogSpec, CatalogCurrency } from "@/lib/catalogFormat";
import { CURRENCY_LABELS, formatCatalogPrice } from "@/lib/catalogFormat";

// Finds where a copy-pasted "Дополнительные характеристики:"-style bullet
// list starts inside free-form text, so we can offer to split it out into
// the specs field instead of leaving it stuck in the description.
function findSpecsBlockStart(text: string): number | null {
  const lines = text.split("\n");
  // A "spec line" is a short label followed by a value after a colon —
  // with or without a leading bullet marker. Capped label length so an
  // ordinary sentence that happens to contain a colon doesn't match.
  const specLine = /^\s*(?:[*•\-]\s*)?[^\s:][^:]{1,45}:\s*\S.*/;
  const headingLine = /^\s*(дополнительные\s+)?характеристики:?\s*$/i;

  let offset = 0;
  let consecutiveSpecLines = 0;
  let blockStart: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (headingLine.test(line)) {
      return offset;
    }
    if (specLine.test(line)) {
      if (consecutiveSpecLines === 0) blockStart = offset;
      consecutiveSpecLines++;
      if (consecutiveSpecLines >= 3) return blockStart;
    } else if (line.trim() !== "") {
      consecutiveSpecLines = 0;
      blockStart = null;
    }
    offset += line.length + 1;
  }
  return null;
}

export default function ItemDetail({ item, canManage }: { item: CatalogItem; canManage: boolean }) {
  const [editing, setEditing] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [tab, setTab] = useState<"description" | "specs" | "delivery">(item.description ? "description" : "specs");
  const router = useRouter();

  const [name, setName] = useState(item.name);
  const [priceText, setPriceText] = useState(item.priceText ?? "");
  const [priceOnRequest, setPriceOnRequest] = useState(item.priceOnRequest);
  const [currency, setCurrency] = useState<CatalogCurrency>(item.currency);
  const [description, setDescription] = useState(item.description ?? "");
  const [specs, setSpecs] = useState<CatalogSpec[]>(item.specs.length > 0 ? item.specs : [{ label: "", value: "" }, { label: "", value: "" }]);
  const [images, setImages] = useState<string[]>(item.images.length > 0 ? item.images : item.imageUrl ? [item.imageUrl] : []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [specPasteOpen, setSpecPasteOpen] = useState(false);
  const [specPasteText, setSpecPasteText] = useState("");
  const [specParsing, setSpecParsing] = useState(false);
  const [specParseError, setSpecParseError] = useState<string | null>(null);
  const [descSpecsExtracting, setDescSpecsExtracting] = useState(false);
  const [descSpecsDismissedAt, setDescSpecsDismissedAt] = useState<number | null>(null);

  const photos = editing ? images : item.images.length > 0 ? item.images : item.imageUrl ? [item.imageUrl] : [];

  const descSpecsBlockStart = useMemo(() => (editing ? findSpecsBlockStart(description) : null), [editing, description]);
  const showDescSpecsSuggestion = descSpecsBlockStart !== null && descSpecsBlockStart !== descSpecsDismissedAt;

  // Shared by the auto-detected banner (extracts just the matched block)
  // and the manual "Проверить описание" button (hands the whole text to
  // Claude, which handles ambiguous formats — dashes, no punctuation —
  // that a regex can't safely tell apart from ordinary prose).
  async function extractSpecsFromText(text: string, cutFrom: number | null) {
    setDescSpecsExtracting(true);
    setSpecParseError(null);
    try {
      const res = await fetch("/api/catalog/parse-specs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSpecParseError(data.error ?? "Не удалось распознать характеристики");
        return;
      }
      const parsed: CatalogSpec[] = data.specs;
      setSpecs((prev) => {
        const existing = prev.filter((s) => s.label.trim() && s.value.trim());
        return [...existing, ...parsed];
      });
      if (cutFrom !== null) setDescription(description.slice(0, cutFrom).trim());
    } finally {
      setDescSpecsExtracting(false);
    }
  }

  function handleExtractSpecsFromDescription() {
    if (descSpecsBlockStart === null) return;
    extractSpecsFromText(description.slice(descSpecsBlockStart).trim(), descSpecsBlockStart);
  }

  function handleCheckDescriptionManually() {
    extractSpecsFromText(description.trim(), null);
  }

  async function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    try {
      const { ok, width, height } = await checkImageDimensions(file);
      if (!ok) {
        setError(`Фото слишком маленькое (${width}×${height}px) — минимум ${MIN_IMAGE_DIMENSION}×${MIN_IMAGE_DIMENSION}px`);
        e.target.value = "";
        return;
      }

      setUploading(true);
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Войдите заново");
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("post-media").upload(path, file);
      if (uploadError) throw uploadError;
      const url = supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
      setImages((prev) => [...prev, url]);

      checkPhotoQualitySoft(file).then((result) => {
        if (!result.ok) setError(`⚠ ${result.reason ?? "Качество фото вызывает сомнения"} — фото добавлено, можно заменить`);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setActivePhoto(0);
  }

  function updateSpec(idx: number, field: "label" | "value", value: string) {
    setSpecs((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function addSpecRow() {
    setSpecs((prev) => [...prev, { label: "", value: "" }]);
  }

  function removeSpecRow(idx: number) {
    setSpecs((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleParseSpecs() {
    const trimmed = specPasteText.trim();
    if (!trimmed) return;
    setSpecParsing(true);
    setSpecParseError(null);
    try {
      const res = await fetch("/api/catalog/parse-specs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSpecParseError(data.error ?? "Не удалось распознать характеристики");
        return;
      }
      const parsed: CatalogSpec[] = data.specs;
      setSpecs((prev) => {
        const existing = prev.filter((s) => s.label.trim() && s.value.trim());
        return [...existing, ...parsed];
      });
      setSpecPasteText("");
      setSpecPasteOpen(false);
    } finally {
      setSpecParsing(false);
    }
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Введите название");
      return;
    }
    const filledSpecs = specs.filter((s) => s.label.trim() && s.value.trim());
    if (filledSpecs.length < 2) {
      setError("Укажите хотя бы 2 характеристики");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/catalog/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmed,
        priceText,
        priceOnRequest,
        currency,
        description,
        images,
        imageUrl: images[0],
        specs: filledSpecs,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Не удалось сохранить");
      return;
    }

    setEditing(false);
    router.refresh();
  }

  function cancelEdit() {
    setName(item.name);
    setPriceText(item.priceText ?? "");
    setPriceOnRequest(item.priceOnRequest);
    setCurrency(item.currency);
    setDescription(item.description ?? "");
    setImages(item.images.length > 0 ? item.images : item.imageUrl ? [item.imageUrl] : []);
    setSpecs(item.specs.length > 0 ? item.specs : [{ label: "", value: "" }, { label: "", value: "" }]);
    setError(null);
    setEditing(false);
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={submitting || uploading}
                className="border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-4 py-1.5 text-sm text-white dark:text-ink disabled:opacity-40"
              >
                {submitting ? "Сохраняем…" : "Сохранить"}
              </button>
              <button onClick={cancelEdit} className="px-4 py-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                Отмена
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-neutral-300 dark:border-line px-4 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-mute"
            >
              ✎ Редактировать
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Галерея */}
        <div className="space-y-2">
          {photos.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => !editing && setLightboxOpen(true)}
                className={`flex max-h-[420px] w-full items-center justify-center rounded-lg bg-neutral-50 dark:bg-panel p-3 ${editing ? "" : "cursor-zoom-in"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photos[Math.min(activePhoto, photos.length - 1)]}
                  alt={item.name}
                  className="max-h-[396px] w-auto max-w-full rounded-lg object-contain"
                />
              </button>
              {(photos.length > 1 || editing) && (
                <div className="flex gap-2 overflow-x-auto">
                  {photos.map((url, idx) => (
                    <div key={url} className="relative shrink-0">
                      <button
                        onClick={() => setActivePhoto(idx)}
                        className={`h-16 w-16 overflow-hidden rounded-lg border ${idx === activePhoto ? "border-neutral-900 dark:border-white" : "border-neutral-200 dark:border-line"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </button>
                      {editing && (
                        <button
                          onClick={() => removePhoto(idx)}
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 dark:border-line bg-white dark:bg-panel text-[10px] text-neutral-600 dark:text-neutral-400"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {editing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex h-16 w-16 shrink-0 items-center justify-center border border-dashed border-neutral-300 dark:border-line text-xs text-neutral-400 dark:text-neutral-500 hover:border-neutral-400 dark:hover:border-mute disabled:opacity-40"
                    >
                      {uploading ? "…" : "+ Фото"}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            editing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-neutral-300 dark:border-line text-sm text-neutral-400 dark:text-neutral-500 hover:border-neutral-400 dark:hover:border-mute"
              >
                {uploading ? "Загрузка…" : "+ Добавить фото"}
              </button>
            )
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAddPhoto} className="hidden" />
        </div>

        {/* Информация */}
        <div className="space-y-5">
          <div>
            <span className="inline-block rounded-full border border-neutral-200 dark:border-line px-2 py-0.5 text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {item.type === "product" ? "Товар" : "Услуга"}
            </span>
            <Link
              href={`/co/${item.companySlug}`}
              className="ml-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-paper hover:underline"
            >
              {item.companyName}
            </Link>
          </div>

          {editing ? (
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название"
                className="block w-full border border-neutral-300 dark:border-line bg-white dark:bg-panel px-3 py-2 text-xl font-semibold"
              />

              <label className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <input type="checkbox" checked={priceOnRequest} onChange={(e) => setPriceOnRequest(e.target.checked)} />
                Цена по запросу
              </label>
              {!priceOnRequest && (
                <div className="flex gap-2">
                  <input
                    value={priceText}
                    onChange={(e) => setPriceText(e.target.value)}
                    placeholder="Цена (напр. от 12 000)"
                    className="block w-full border border-neutral-300 dark:border-line bg-white dark:bg-panel px-3 py-2 text-sm"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CatalogCurrency)}
                    className="shrink-0 border border-neutral-300 dark:border-line bg-white dark:bg-panel px-2 py-2 text-sm"
                  >
                    {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Описание, характеристики, условия"
                  className="block w-full border border-neutral-300 dark:border-line bg-white dark:bg-panel px-3 py-2 text-sm"
                />
                {description.trim() && (
                  <div className="mt-1 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCheckDescriptionManually}
                      disabled={descSpecsExtracting}
                      className="text-xs text-neutral-500 dark:text-neutral-400 underline hover:text-neutral-900 dark:hover:text-paper disabled:opacity-40"
                    >
                      {descSpecsExtracting ? "Проверяем…" : "🔍 Проверить описание на характеристики"}
                    </button>
                    <ImproveTextButton text={description} onImproved={setDescription} />
                  </div>
                )}
                {showDescSpecsSuggestion && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-dashed border-neutral-300 dark:border-line p-2 text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Похоже, в описании есть список характеристик — перенести их в «Характеристики»?
                    </span>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={handleExtractSpecsFromDescription}
                        disabled={descSpecsExtracting}
                        className="rounded-lg border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-2.5 py-1 text-white dark:text-ink disabled:opacity-40"
                      >
                        {descSpecsExtracting ? "Переносим…" : "Перенести"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescSpecsDismissedAt(descSpecsBlockStart)}
                        className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                      >
                        Не сейчас
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-500 dark:text-neutral-400">Характеристики — минимум 2</label>
                  <button
                    type="button"
                    onClick={() => setSpecPasteOpen((v) => !v)}
                    className="text-xs text-neutral-500 dark:text-neutral-400 underline hover:text-neutral-900 dark:hover:text-paper"
                  >
                    ✨ Вставить списком
                  </button>
                </div>

                {specPasteOpen && (
                  <div className="mt-1.5 space-y-1.5 rounded-lg border border-dashed border-neutral-300 dark:border-line p-2">
                    <textarea
                      value={specPasteText}
                      onChange={(e) => setSpecPasteText(e.target.value)}
                      rows={4}
                      placeholder="Вставьте скопированный список характеристик — ИИ сам разложит их по параметрам"
                      className="block w-full border border-neutral-300 dark:border-line bg-white dark:bg-panel px-2 py-1.5 text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleParseSpecs}
                        disabled={specParsing || !specPasteText.trim()}
                        className="rounded-lg border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-3 py-1 text-xs text-white dark:text-ink disabled:opacity-40"
                      >
                        {specParsing ? "Распознаём…" : "Распознать с ИИ"}
                      </button>
                      {specParseError && <span className="text-xs text-red-600">{specParseError}</span>}
                    </div>
                  </div>
                )}

                <div className="mt-1.5 space-y-1.5">
                  {specs.map((spec, idx) => (
                    <div key={idx} className="flex gap-1.5">
                      <input
                        value={spec.label}
                        onChange={(e) => updateSpec(idx, "label", e.target.value)}
                        placeholder="Параметр"
                        className="w-1/2 border border-neutral-300 dark:border-line bg-white dark:bg-panel px-2 py-1.5 text-xs"
                      />
                      <input
                        value={spec.value}
                        onChange={(e) => updateSpec(idx, "value", e.target.value)}
                        placeholder="Значение"
                        className="w-1/2 border border-neutral-300 dark:border-line bg-white dark:bg-panel px-2 py-1.5 text-xs"
                      />
                      {specs.length > 2 && (
                        <button
                          onClick={() => removeSpecRow(idx)}
                          className="shrink-0 px-1 text-neutral-400 dark:text-neutral-500 hover:text-red-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addSpecRow}
                  className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 underline hover:text-neutral-900 dark:hover:text-paper"
                >
                  + Добавить характеристику
                </button>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={submitting || uploading}
                  className="rounded-lg border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-4 py-1.5 text-sm text-white dark:text-ink disabled:opacity-40"
                >
                  {submitting ? "Сохраняем…" : "Сохранить"}
                </button>
                <button onClick={cancelEdit} className="rounded-lg px-4 py-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-semibold leading-tight text-neutral-900 dark:text-paper">{item.name}</h1>
                {(item.priceOnRequest || item.priceText) && (
                  <div className={`mt-2 text-2xl font-semibold ${item.priceOnRequest ? "text-lg font-medium text-neutral-500 dark:text-neutral-400" : "text-emerald-600 dark:text-gain"}`}>
                    {formatCatalogPrice(item)}
                  </div>
                )}
              </div>

              {!canManage && (
                <div className="flex flex-wrap gap-2">
                  <ApplicationForm
                    companyId={item.companyId}
                    allowInvestment={false}
                    triggerLabel="Оставить заявку"
                    defaultMessage={`Здравствуйте! Пишу из SAPNUM по поводу «${item.name}»: `}
                  />
                  <MessageButton
                    otherUserId={item.companyOwnerId}
                    label="Написать о товаре"
                    draft={`Здравствуйте! Пишу из SAPNUM. Подскажите, пожалуйста, про «${item.name}»`}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!editing && (
        <div className="rounded-lg border border-neutral-200 dark:border-line">
          <div className="flex gap-1 border-b border-neutral-200 dark:border-line px-2 pt-2">
            {([
              ["description", "Описание"],
              ["specs", `${item.type === "product" ? "Характеристики" : "Детали услуги"}`],
              ["delivery", item.type === "product" ? "Доставка" : "Условия"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                  tab === key
                    ? "border-neutral-900 dark:border-paper text-neutral-900 dark:text-paper"
                    : "border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {tab === "description" &&
              (item.description ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{item.description}</p>
              ) : (
                <p className="text-sm text-neutral-400 dark:text-neutral-500">Продавец пока не добавил описание.</p>
              ))}

            {tab === "specs" &&
              (item.specs.length > 0 ? (
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-neutral-200 dark:border-line bg-neutral-200 dark:bg-line">
                  {item.specs.map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-panel p-3">
                      <div className="text-[11px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">{s.label}</div>
                      <div className="mt-0.5 text-sm font-medium text-neutral-900 dark:text-paper">{s.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400 dark:text-neutral-500">Характеристики не указаны.</p>
              ))}

            {tab === "delivery" && (
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {item.type === "product"
                  ? "Способ и стоимость доставки уточняйте у продавца — напишите ему напрямую или оставьте заявку."
                  : "Формат оказания услуги и условия уточняйте у продавца — напишите ему напрямую или оставьте заявку."}
              </p>
            )}
          </div>
        </div>
      )}

      {lightboxOpen && photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Закрыть"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            ✕
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhoto((p) => (p - 1 + photos.length) % photos.length);
                }}
                aria-label="Предыдущее фото"
                className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:left-4"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhoto((p) => (p + 1) % photos.length);
                }}
                aria-label="Следующее фото"
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:right-4"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[Math.min(activePhoto, photos.length - 1)]}
            alt={item.name}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
