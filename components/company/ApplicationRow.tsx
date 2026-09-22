"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CompanyApplication } from "@/lib/companies";

const TYPE_LABELS: Record<string, string> = {
  partnership: "Партнёрство",
  distributor: "Дистрибьютор",
  commercial_offer: "Коммерческое предложение",
  investment: "Инвестиции",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "На рассмотрении",
  reviewing: "В работе",
  accepted: "Принята",
  rejected: "Отклонена",
};

export default function ApplicationRow({ application }: { application: CompanyApplication }) {
  const [status, setStatus] = useState(application.status);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function updateStatus(next: string) {
    setStatus(next);
    await fetch(`/api/applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="border border-neutral-200 p-3">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>{TYPE_LABELS[application.type] ?? application.type}</span>
        <span>{STATUS_LABELS[status] ?? status}</span>
      </div>
      <div className="mt-1 text-sm font-medium text-neutral-900">{application.applicantName}</div>
      {application.requestedAmount && (
        <div className="text-xs text-neutral-500">Сумма: ${application.requestedAmount.toLocaleString("ru-RU")}</div>
      )}
      <p className="mt-1.5 text-sm text-neutral-700">{application.message}</p>

      {status === "pending" && (
        <div className="mt-2 flex gap-2">
          <button
            disabled={isPending}
            onClick={() => updateStatus("reviewing")}
            className="border border-neutral-300 px-2.5 py-1 text-xs hover:border-neutral-400"
          >
            В работу
          </button>
          <button
            disabled={isPending}
            onClick={() => updateStatus("accepted")}
            className="border border-neutral-900 bg-neutral-900 px-2.5 py-1 text-xs text-white"
          >
            Принять
          </button>
          <button
            disabled={isPending}
            onClick={() => updateStatus("rejected")}
            className="border border-neutral-300 px-2.5 py-1 text-xs text-neutral-500 hover:border-neutral-400"
          >
            Отклонить
          </button>
        </div>
      )}
    </div>
  );
}
