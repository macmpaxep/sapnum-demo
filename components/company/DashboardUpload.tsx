"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardUpload({ compact = false }: { compact?: boolean }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/dashboard/upload", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!res.ok) {
      setError(data.error ?? "Не удалось загрузить файл");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" id="dashboard-file-input" />
      <label
        htmlFor="dashboard-file-input"
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper text-white dark:text-ink hover:opacity-90 ${
          compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
        }`}
      >
        {uploading ? "Загрузка…" : "Загрузить данные (Excel/CSV)"}
      </label>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
