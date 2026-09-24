"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { checkImageDimensions, checkPhotoQualitySoft, MIN_IMAGE_DIMENSION } from "@/lib/imageQuality";
import ImproveTextButton from "@/components/ai/ImproveTextButton";
import MessageButton from "@/components/company/MessageButton";
import ApplicationForm from "@/components/company/ApplicationForm";
import type { CatalogItem, CatalogSpec } from "@/lib/catalog";

export default function ItemDetail({ item, canManage }: { item: CatalogItem; canManage: boolean }) {
  const [editing, setEditing] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const router = useRouter();

  const [name, setName] = useState(item.name);
  const [priceText, setPriceText] = useState(item.priceText ?? "");
  const [priceOnRequest, setPriceOnRequest] = useState(item.priceOnRequest);
  const [description, setDescription] = useState(item.description ?? "");
  const [specs, setSpecs] = useState<CatalogSpec[]>(item.specs.length > 0 ? item.specs : [{ label: "", value: "" }, { label: "", value: "" }]);
  const [images, setImages] = useState<string[]>(item.images.length > 0 ? item.images : item.imageUrl ? [item.imageUrl] : []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photos = editing ? images : item.images.length > 0 ? item.images : item.imageUrl ? [item.imageUrl] : [];

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
                className="border border-neutral-900 bg-neutral-900 px-4 py-1.5 text-sm text-white disabled:opacity-40"
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
              className="border border-neutral-300 dark:border-line px-4 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-mute"
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
              <div className="mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-lg bg-neutral-50 dark:bg-panel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photos[Math.min(activePhoto, photos.length - 1)]}
                  alt={item.name}
                  className="h-full w-full object-contain p-6"
                />
              </div>
              {(photos.length > 1 || editing) && (
                <div className="mx-auto flex max-w-[420px] gap-2 overflow-x-auto">
                  {photos.map((url, idx) => (
                    <div key={url} className="relative shrink-0">
                      <button
                        onClick={() => setActivePhoto(idx)}
                        className={`h-16 w-16 overflow-hidden border ${idx === activePhoto ? "border-neutral-900 dark:border-white" : "border-neutral-200 dark:border-line"}`}
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
                className="mx-auto flex aspect-square w-full max-w-[420px] items-center justify-center border border-dashed border-neutral-300 dark:border-line text-sm text-neutral-400 dark:text-neutral-500 hover:border-neutral-400 dark:hover:border-mute"
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
            <span className="inline-block border border-neutral-200 dark:border-line px-2 py-0.5 text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
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
                <input
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value)}
                  placeholder="Цена (напр. от 12 000 ₸)"
                  className="block w-full border border-neutral-300 dark:border-line bg-white dark:bg-panel px-3 py-2 text-sm"
                />
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
                  <div className="mt-1 text-right">
                    <ImproveTextButton text={description} onImproved={setDescription} />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">Характеристики — минимум 2</label>
                <div className="mt-1 space-y-1.5">
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
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-semibold leading-tight text-neutral-900 dark:text-paper">{item.name}</h1>
                <div className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-paper">
                  {item.priceOnRequest ? (
                    <span className="text-lg font-medium text-neutral-500 dark:text-neutral-400">Цена по запросу</span>
                  ) : (
                    item.priceText || ""
                  )}
                </div>
              </div>

              {!canManage && (
                <div className="flex flex-wrap gap-2">
                  <ApplicationForm
                    companyId={item.companyId}
                    allowInvestment={false}
                    triggerLabel="Оставить заявку"
                    defaultMessage={`По поводу «${item.name}»: `}
                  />
                  <MessageButton
                    otherUserId={item.companyOwnerId}
                    label="Написать о товаре"
                    draft={`Здравствуйте! Подскажите, пожалуйста, про «${item.name}»`}
                  />
                </div>
              )}

              {item.specs.length > 0 && (
                <div className="grid grid-cols-2 gap-px overflow-hidden border border-neutral-200 dark:border-line bg-neutral-200 dark:bg-line">
                  {item.specs.map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-panel p-3">
                      <div className="text-[11px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">{s.label}</div>
                      <div className="mt-0.5 text-sm font-medium text-neutral-900 dark:text-paper">{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {item.description && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {item.description}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
