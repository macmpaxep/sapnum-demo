import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMyApplications } from "@/lib/applications";

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

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const applications = await getMyApplications(user.id);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">Мои заявки</h1>

      {applications.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">
          Вы пока не подавали заявок. Найдите компанию через ленту или каталог и нажмите «Подать заявку» на её странице.
        </p>
      )}

      <div className="mt-4 space-y-2">
        {applications.map((a) => (
          <div key={a.id} className="border border-neutral-200 p-3">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{TYPE_LABELS[a.type] ?? a.type}</span>
              <span>{STATUS_LABELS[a.status] ?? a.status}</span>
            </div>
            <Link href={`/company/${a.companySlug}`} className="mt-1 block text-sm font-medium text-neutral-900 hover:underline">
              {a.companyName}
            </Link>
            {a.requestedAmount && (
              <div className="text-xs text-neutral-500">Сумма: ${a.requestedAmount.toLocaleString("ru-RU")}</div>
            )}
            <p className="mt-1.5 text-sm text-neutral-700">{a.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
