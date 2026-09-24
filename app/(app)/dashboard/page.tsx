import Link from "next/link";
import ProfileSidebarData from "@/components/demo/ProfileSidebarData";
import AiPanel from "@/components/demo/AiPanel";
import Chat from "@/components/demo/Chat";
import Sparkline from "@/components/demo/Sparkline";
import { overviewStats, overviewSeries } from "@/lib/demo-data";

export default function DashboardPage() {
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
              Показатели компании за текущий месяц
            </p>
          </div>
          <Link href="/metrics" className="shrink-0 border border-neutral-300 dark:border-line px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-mute">
            Показатели →
          </Link>
        </div>

        {/* на мобильном: 2 колонки (продажи + эффективность), тенденция на след. строке */}
        <div className="grid grid-cols-2 gap-4">
          {overviewStats.map((s) => (
            <div key={s.label} className="rounded-lg border border-neutral-200 dark:border-line p-4">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">{s.label}</div>
              <div className="num mt-2 font-mono text-2xl text-neutral-900 dark:text-paper">
                {s.value}
                <span className="ml-1 text-sm text-neutral-400 dark:text-neutral-500">{s.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-line p-4">
          <div className="text-sm font-medium text-neutral-900 dark:text-paper">
            Динамика продаж
          </div>
          <div className="mt-3 h-52">
            <Sparkline data={overviewSeries} height={200} />
          </div>
        </div>
      </main>

      <div className="flex flex-col gap-6 min-w-0">
        <AiPanel />
        <Chat />
      </div>
    </div>
  );
}