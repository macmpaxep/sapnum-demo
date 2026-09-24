"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { checkImageDimensions, checkPhotoQualitySoft, MIN_IMAGE_DIMENSION } from "@/lib/imageQuality";
import ImproveTextButton from "@/components/ai/ImproveTextButton";
import MessageButton from "@/components/company/MessageButton";
import ApplicationForm from "@/components/company/ApplicationForm";
import type { CatalogItem } from "@/lib/catalog";

export default function ItemDetail({ item, canManage }: { item: CatalogItem; canManage: boolean }) {
  const [editing, setEditing] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const router = useRouter();

  const [name, setName] = useState(item.name);
  const [priceText, setPriceText] = useState(item.priceText ?? "");
  const [priceOnRequest, setPriceOnRequest] = useState(item.priceOnRequest);
  const [description, setDescription] = useState(item.description ?? "");
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

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Введите название");
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
              className="border border-neutral-300 dark:border-neutral-700 px-4 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600"
            >
              ✎ Редактировать
            </button>
          )}
        </div>
      )}

      {photos.length > 0 ? (
        <div className="space-y-2">
          <div className="aspect-[4/3] w-full overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[Math.min(activePhoto, photos.length - 1)]} alt="" className="h-full w-full object-cover" />
          </div>
          {(photos.length > 1 || editing) && (
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((url, idx) => (
                <div key={url} className="relative shrink-0">
                  <button
                    onClick={() => setActivePhoto(idx)}
                    className={`h-16 w-16 overflow-hidden border ${idx === activePhoto ? "border-neutral-900" : "border-neutral-200 dark:border-neutral-800"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                  {editing && (
                    <button
                      onClick={() => removePhoto(idx)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[10px] text-neutral-600 dark:text-neutral-400"
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
                  className="flex h-16 w-16 shrink-0 items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-700 text-xs text-neutral-400 dark:text-neutral-500 hover:border-neutral-400 dark:hover:border-neutral-600 disabled:opacity-40"
                >
                  {uploading ? "…" : "+ Фото"}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        editing && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[4/3] w-full items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-700 text-sm text-neutral-400 dark:text-neutral-500 hover:border-neutral-400 dark:hover:border-neutral-600"
          >
            {uploading ? "Загрузка…" : "+ Добавить фото"}
          </button>
        )
      )}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAddPhoto} className="hidden" />

      {editing ? (
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название"
            className="block w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-lg font-semibold"
          />

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              <input type="checkbox" checked={priceOnRequest} onChange={(e) => setPriceOnRequest(e.target.checked)} />
              Цена по запросу
            </label>
          </div>
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
              rows={5}
              placeholder="Описание, характеристики"
              className="block w-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
            />
            {description.trim() && (
              <div className="mt-1 text-right">
                <ImproveTextButton text={description} onImproved={setDescription} />
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{item.name}</h1>
          <div className="text-base text-neutral-900 dark:text-neutral-50">
            {item.priceOnRequest ? "Цена по запросу" : item.priceText || ""}
          </div>
          {item.description && <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{item.description}</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-4 text-sm">
        <Link href={`/co/${item.companySlug}`} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:underline">
          {item.companyName}
        </Link>
      </div>

      {!editing && !canManage && (
        <div className="flex flex-wrap gap-2 pt-2">
          <MessageButton otherUserId={item.companyOwnerId} label="Написать о товаре" />
          <ApplicationForm
            companyId={item.companyId}
            allowInvestment={false}
            triggerLabel="Оставить заявку"
            defaultMessage={`По поводу «${item.name}»: `}
          />
        </div>
      )}
    </div>
  );
}
