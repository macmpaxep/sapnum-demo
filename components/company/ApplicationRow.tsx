"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CompanyApplication } from "@/lib/companies";
import MessageButton from "@/components/company/MessageButton";

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
    <div className="rounded-lg border border-neutral-200 dark:border-line p-3">
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>{TYPE_LABELS[application.type] ?? application.type}</span>
        <span>{STATUS_LABELS[status] ?? status}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        {application.applicantUsername ? (
          <Link
            href={`/u/${application.applicantUsername}`}
            className="text-sm font-medium text-neutral-900 dark:text-paper hover:underline"
          >
            {application.applicantName}
          </Link>
        ) : (
          <span className="text-sm font-medium text-neutral-900 dark:text-paper">{application.applicantName}</span>
        )}
      </div>
      {application.requestedAmount && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400">Сумма: ${application.requestedAmount.toLocaleString("ru-RU")}</div>
      )}
      <p className="mt-1.5 text-sm text-neutral-700 dark:text-neutral-300">{application.message}</p>

      <div className="mt-2">
        <MessageButton otherUserId={application.applicantId} label="Написать заявителю" />
      </div>

      {status === "pending" && (
        <div className="mt-2 flex gap-2">
          <button
            disabled={isPending}
            onClick={() => updateStatus("reviewing")}
            className="border border-neutral-300 dark:border-line px-2.5 py-1 text-xs hover:border-neutral-400 dark:hover:border-mute"
          >
            В работу
          </button>
          <button
            disabled={isPending}
            onClick={() => updateStatus("accepted")}
            className="border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-2.5 py-1 text-xs text-white dark:text-ink"
          >
            Принять
          </button>
          <button
            disabled={isPending}
            onClick={() => updateStatus("rejected")}
            className="border border-neutral-300 dark:border-line px-2.5 py-1 text-xs text-neutral-500 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-mute"
          >
            Отклонить
          </button>
        </div>
      )}
    </div>
  );
}
