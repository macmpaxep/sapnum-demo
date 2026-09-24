"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { checkImageDimensions, checkPhotoQualitySoft, MIN_IMAGE_DIMENSION } from "@/lib/imageQuality";
import ImproveTextButton from "@/components/ai/ImproveTextButton";
import type { CatalogItem, CatalogSpec } from "@/lib/catalog";

export default function CatalogManager({
  companyId,
  items,
  canManage,
  autoOpen = false,
}: {
  companyId: string;
  items: CatalogItem[];
  canManage: boolean;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoOpen) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [autoOpen]);
  const [type, setType] = useState<"product" | "service">("product");
  const [name, setName] = useState("");
  const [priceText, setPriceText] = useState("");
  const [priceOnRequest, setPriceOnRequest] = useState(false);
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [specs, setSpecs] = useState<CatalogSpec[]>([
    { label: "", value: "" },
    { label: "", value: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const router = useRouter();

  async function uploadOne(file: File): Promise<string> {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Войдите заново");
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("post-media").upload(path, file);
    if (uploadError) throw uploadError;
    return supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filledSpecs = specs.filter((s) => s.label.trim() && s.value.trim());
    if (filledSpecs.length < 2) {
      setError("Укажите хотя бы 2 характеристики — это помогает покупателям сравнивать");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let imageUrl: string | undefined;
      if (imageFile) imageUrl = await uploadOne(imageFile);
      const extraUrls = extraFiles.length > 0 ? await Promise.all(extraFiles.map(uploadOne)) : [];
      const images = imageUrl ? [imageUrl, ...extraUrls] : extraUrls;

      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          type,
          name,
          priceText,
          priceOnRequest,
          description,
          imageUrl,
          images,
          specs: filledSpecs,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Не удалось добавить");
      }

      setName("");
      setPriceText("");
      setPriceOnRequest(false);
      setDescription("");
      setImageFile(null);
      setExtraFiles([]);
      setSpecs([
        { label: "", value: "" },
        { label: "", value: "" },
      ]);
      setQualityWarning(null);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      return;
    }
    setQualityWarning(null);
    try {
      const { ok, width, height } = await checkImageDimensions(file);
      if (!ok) {
        setError(`Фото слишком маленькое (${width}×${height}px) — минимум ${MIN_IMAGE_DIMENSION}×${MIN_IMAGE_DIMENSION}px`);
        e.target.value = "";
        setImageFile(null);
        return;
      }
      setError(null);
      setImageFile(file);
      checkPhotoQualitySoft(file).then((result) => {
        if (!result.ok) setQualityWarning(result.reason ?? "Качество фото вызывает сомнения");
      });
    } catch {
      setError("Не удалось прочитать файл");
    }
  }

  async function handleExtraFilesSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setQualityWarning(null);

    const accepted: File[] = [];
    for (const file of files) {
      try {
        const { ok, width, height } = await checkImageDimensions(file);
        if (!ok) {
          setError(`Фото слишком маленькое (${width}×${height}px) — минимум ${MIN_IMAGE_DIMENSION}×${MIN_IMAGE_DIMENSION}px, пропущено: ${file.name}`);
          continue;
        }
        accepted.push(file);
        checkPhotoQualitySoft(file).then((result) => {
          if (!result.ok) setQualityWarning(result.reason ?? "Качество одного из фото вызывает сомнения");
        });
      } catch {
        setError(`Не удалось прочитать файл: ${file.name}`);
      }
    }
    setExtraFiles((prev) => [...prev, ...accepted]);
    e.target.value = "";
  }

  function removeExtraFile(idx: number) {
    setExtraFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/catalog/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const products = items.filter((i) => i.type === "product");
  const services = items.filter((i) => i.type === "service");

  return (
    <div className="space-y-6">
      {canManage && (
        <div ref={formRef}>
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg border border-neutral-300 dark:border-line px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-mute"
            >
              + Добавить товар / услугу
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 border border-neutral-200 dark:border-line p-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("product")}
                  className={`border px-3 py-1.5 text-xs ${type === "product" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 dark:border-line text-neutral-600 dark:text-neutral-400"}`}
                >
                  Товар
                </button>
                <button
                  type="button"
                  onClick={() => setType("service")}
                  className={`border px-3 py-1.5 text-xs ${type === "service" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 dark:border-line text-neutral-600 dark:text-neutral-400"}`}
                >
                  Услуга
                </button>
              </div>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Название"
                className="block w-full border border-neutral-300 dark:border-line px-3 py-2 text-sm"
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
                  className="block w-full border border-neutral-300 dark:border-line px-3 py-2 text-sm"
                />
              )}
              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Описание"
                  className="block w-full border border-neutral-300 dark:border-line px-3 py-2 text-sm"
                />
                {description.trim() && (
                  <div className="mt-1 text-right">
                    <ImproveTextButton text={description} onImproved={setDescription} />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">
                  Характеристики — минимум 2 (напр. «Материал» / «Гарантия»)
                </label>
                <div className="mt-1 space-y-1.5">
                  {specs.map((spec, idx) => (
                    <div key={idx} className="flex gap-1.5">
                      <input
                        value={spec.label}
                        onChange={(e) => updateSpec(idx, "label", e.target.value)}
                        placeholder="Параметр (напр. Материал)"
                        className="w-1/2 border border-neutral-300 dark:border-line px-2 py-1.5 text-xs"
                      />
                      <input
                        value={spec.value}
                        onChange={(e) => updateSpec(idx, "value", e.target.value)}
                        placeholder="Значение (напр. Нержавеющая сталь)"
                        className="w-1/2 border border-neutral-300 dark:border-line px-2 py-1.5 text-xs"
                      />
                      {specs.length > 2 && (
                        <button
                          type="button"
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
                  type="button"
                  onClick={addSpecRow}
                  className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 underline hover:text-neutral-900 dark:hover:text-paper"
                >
                  + Добавить характеристику
                </button>
              </div>

              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">
                  Основное фото — оно будет главным на карточке товара
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-1 block w-full text-xs text-neutral-500 dark:text-neutral-400"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400">Дополнительные фото (необязательно)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleExtraFilesSelect}
                  className="mt-1 block w-full text-xs text-neutral-500 dark:text-neutral-400"
                />
                {extraFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {extraFiles.map((f, idx) => (
                      <div key={`${f.name}-${idx}`} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(f)} alt="" className="h-14 w-14 border border-neutral-200 dark:border-line object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExtraFile(idx)}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 dark:border-line bg-white dark:bg-panel text-[10px] text-neutral-600 dark:text-neutral-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {qualityWarning && (
                <p className="text-xs text-amber-600">
                  ⚠ {qualityWarning} — можно опубликовать как есть или заменить фото.
                </p>
              )}
              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-40"
                >
                  {submitting ? "Добавляем…" : "Добавить"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {["Товары", "Услуги"].map((label, idx) => {
        const list = idx === 0 ? products : services;
        if (list.length === 0) return null;
        return (
          <div key={label}>
            <h3 className="mb-2 text-sm font-medium text-neutral-900 dark:text-paper">{label}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {list.map((item) => (
                <div key={item.id} className="group relative text-center">
                  <Link href={`/item/${item.id}`}>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="aspect-square w-full rounded-lg border border-neutral-200 dark:border-line object-cover" />
                    ) : (
                      <div className="aspect-square rounded-lg border border-neutral-200 dark:border-line bg-neutral-50 dark:bg-panel" />
                    )}
                    <div className="mt-2 text-xs font-medium text-neutral-900 dark:text-paper">{item.name}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {item.priceOnRequest ? "Цена по запросу" : item.priceText}
                    </div>
                  </Link>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full border border-neutral-300 dark:border-line bg-white dark:bg-panel text-xs text-neutral-600 dark:text-neutral-400 group-hover:flex"
                      aria-label="Удалить"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {items.length === 0 && !canManage && <p className="text-sm text-neutral-500 dark:text-neutral-400">В каталоге пока пусто.</p>}
    </div>
  );
}
