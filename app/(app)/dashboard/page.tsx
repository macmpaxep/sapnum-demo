import Link from "next/link";
import ProfileSidebarData from "@/components/demo/ProfileSidebarData";
import AiPanel from "@/components/demo/AiPanel";
import Chat from "@/components/demo/Chat";
import Sparkline from "@/components/demo/Sparkline";
import DashboardUpload from "@/components/company/DashboardUpload";
import { getCurrentUser } from "@/lib/auth";
import { getCompanySlugForUser, getCompanyBySlug } from "@/lib/companies";
import { getCompanyDashboard } from "@/lib/dashboard";

function formatMoney(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n);
}

const MONTH_LABELS = [
  "янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек",
];

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${MONTH_LABELS[Number(m) - 1]} ${y}`;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const slug = user ? await getCompanySlugForUser(user.id) : null;
  const company = slug ? await getCompanyBySlug(slug) : null;
  const dashboard = company ? await getCompanyDashboard(company.id) : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
      <div className="lg:col-start-1">
        <ProfileSidebarData />
      </div>

      <main className="min-w-0 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-paper">Обзор</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {dashboard ? `Показатели по данным из «${dashboard.sourceFilename}»` : "Показатели компании"}
            </p>
          </div>
          {dashboard && <DashboardUpload compact />}
        </div>

        {!company && (
          <div className="rounded-lg border border-dashed border-neutral-300 dark:border-line p-6 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Чтобы видеть аналитику, сначала создайте страницу компании.
            </p>
            <Link href="/co/new" className="mt-3 inline-block rounded-lg border border-neutral-900 dark:border-paper bg-neutral-900 dark:bg-paper px-4 py-2 text-sm text-white dark:text-ink">
              Создать страницу компании
            </Link>
          </div>
        )}

        {company && !dashboard && (
          <div className="rounded-lg border border-dashed border-neutral-300 dark:border-line p-6 text-center">
            <p className="text-sm font-medium text-neutral-900 dark:text-paper">Пока нет данных для анализа</p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Загрузите выгрузку продаж в Excel или CSV (например, из Битрикс24, amoCRM или 1С) — нужны колонки
              с датой, товаром/услугой и суммой. Мы посчитаем динамику продаж и ИИ напишет обзор.
            </p>
            <div className="mt-4 flex justify-center">
              <DashboardUpload />
            </div>
          </div>
        )}

        {company && dashboard && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <a href="#detail-revenue" className="rounded-lg border border-neutral-200 dark:border-line p-4 hover:border-neutral-400 dark:hover:border-mute">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Продажи</div>
                <div className="num mt-2 font-mono text-2xl text-neutral-900 dark:text-paper">
                  {formatMoney(dashboard.summary.totalRevenue)}
                  <span className="ml-1 text-sm text-neutral-400 dark:text-neutral-500">₸</span>
                </div>
              </a>
              <a href="#detail-revenue" className="rounded-lg border border-neutral-200 dark:border-line p-4 hover:border-neutral-400 dark:hover:border-mute">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Средний чек</div>
                <div className="num mt-2 font-mono text-2xl text-neutral-900 dark:text-paper">
                  {formatMoney(dashboard.summary.averageCheck)}
                  <span className="ml-1 text-sm text-neutral-400 dark:text-neutral-500">₸</span>
                </div>
              </a>
              <a href="#detail-revenue" className="rounded-lg border border-neutral-200 dark:border-line p-4 hover:border-neutral-400 dark:hover:border-mute">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Тенденция</div>
                <div className={`num mt-2 font-mono text-2xl ${dashboard.summary.growthPct !== null && dashboard.summary.growthPct < 0 ? "text-red-500" : "text-emerald-600 dark:text-gain"}`}>
                  {dashboard.summary.growthPct !== null ? `${dashboard.summary.growthPct > 0 ? "+" : ""}${dashboard.summary.growthPct}` : "—"}
                  <span className="ml-1 text-sm text-neutral-400 dark:text-neutral-500">%</span>
                </div>
              </a>
              <a href="#detail-revenue" className="rounded-lg border border-neutral-200 dark:border-line p-4 hover:border-neutral-400 dark:hover:border-mute">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Динамика продаж</div>
                {dashboard.summary.monthlySeries.length >= 2 ? (
                  <div className="mt-2 h-10">
                    <Sparkline data={dashboard.summary.monthlySeries.map((m) => m.revenue)} height={40} />
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">Нужно 2+ месяца данных</div>
                )}
              </a>
            </div>

            {dashboard.aiOverview && (
              <div className="rounded-lg border border-neutral-200 dark:border-line p-4">
                <div className="text-sm font-medium text-neutral-900 dark:text-paper">Обзор от ИИ</div>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{dashboard.aiOverview}</p>
              </div>
            )}

            {/* Показатели — слито в ту же вкладку вместо отдельной страницы */}
            <div id="detail-revenue" className="space-y-4 scroll-mt-4">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-paper">Показатели</h2>

              {dashboard.summary.monthlySeries.length > 0 && (
                <div className="rounded-lg border border-neutral-200 dark:border-line p-4">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Выручка по месяцам</div>
                  <div className="mt-3 space-y-1.5">
                    {dashboard.summary.monthlySeries.map((m) => (
                      <div key={m.month} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">{monthLabel(m.month)}</span>
                        <span className="num font-mono text-neutral-900 dark:text-paper">{formatMoney(m.revenue)} ₸</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dashboard.summary.topProducts.length > 0 && (
                <div className="rounded-lg border border-neutral-200 dark:border-line p-4">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Топ товары/услуги по выручке</div>
                  <div className="mt-3 space-y-1.5">
                    {dashboard.summary.topProducts.map((p) => (
                      <div key={p.name} className="flex items-center justify-between text-sm">
                        <span className="truncate text-neutral-600 dark:text-neutral-400">{p.name}</span>
                        <span className="num shrink-0 font-mono text-neutral-900 dark:text-paper">{formatMoney(p.revenue)} ₸</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <div className="flex flex-col gap-6 min-w-0">
        <AiPanel />
        <Chat />
      </div>
    </div>
  );
}
