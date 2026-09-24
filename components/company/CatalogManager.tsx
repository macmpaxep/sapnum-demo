"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { checkImageDimensions, checkPhotoQualitySoft, MIN_IMAGE_DIMENSION } from "@/lib/imageQuality";
import ImproveTextButton from "@/components/ai/ImproveTextButton";
import type { CatalogItem } from "@/lib/catalog";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Войдите заново");
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("post-media").upload(path, imageFile);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
      }

      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, type, name, priceText, priceOnRequest, description, imageUrl }),
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
              className="border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600"
            >
              + Добавить товар / услугу
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 border border-neutral-200 dark:border-neutral-800 p-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("product")}
                  className={`border px-3 py-1.5 text-xs ${type === "product" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"}`}
                >
                  Товар
                </button>
                <button
                  type="button"
                  onClick={() => setType("service")}
                  className={`border px-3 py-1.5 text-xs ${type === "service" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"}`}
                >
                  Услуга
                </button>
              </div>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Название"
                className="block w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
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
                  className="block w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
                />
              )}
              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Описание"
                  className="block w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
                />
                {description.trim() && (
                  <div className="mt-1 text-right">
                    <ImproveTextButton text={description} onImproved={setDescription} />
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-xs text-neutral-500 dark:text-neutral-400"
              />

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
            <h3 className="mb-2 text-sm font-medium text-neutral-900 dark:text-neutral-50">{label}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {list.map((item) => (
                <div key={item.id} className="group relative text-center">
                  <Link href={`/item/${item.id}`}>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="aspect-square w-full border border-neutral-200 dark:border-neutral-800 object-cover" />
                    ) : (
                      <div className="aspect-square border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900" />
                    )}
                    <div className="mt-2 text-xs font-medium text-neutral-900 dark:text-neutral-50">{item.name}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {item.priceOnRequest ? "Цена по запросу" : item.priceText}
                    </div>
                  </Link>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-600 dark:text-neutral-400 group-hover:flex"
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
