import ProfileSidebarData from "@/components/demo/ProfileSidebarData";
import AiPanel from "@/components/demo/AiPanel";
import Chat from "@/components/demo/Chat";
import {
  metricsPeriod,
  metricRows,
  comparisonMetrics,
  riskLevel,
} from "@/lib/demo-data";

function ComparisonBar({
  label,
  mine,
  competitors,
}: {
  label: string;
  mine: number;
  competitors: number;
}) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 p-4">
      <div className="text-sm text-neutral-700 dark:text-neutral-300">{label}</div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs text-neutral-500 dark:text-neutral-400">Моя</span>
          <div className="h-2 flex-1 bg-neutral-100 dark:bg-neutral-800">
            <div className="h-2 bg-neutral-900" style={{ width: `${mine}%` }} />
          </div>
          <span className="num w-10 shrink-0 text-right font-mono text-xs text-neutral-900 dark:text-neutral-50">
            {mine}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs text-neutral-500 dark:text-neutral-400">Конкуренты</span>
          <div className="h-2 flex-1 bg-neutral-100 dark:bg-neutral-800">
            <div className="h-2 bg-neutral-400" style={{ width: `${competitors}%` }} />
          </div>
          <span className="num w-10 shrink-0 text-right font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {competitors}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MetricsPage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
      <div className="lg:col-start-1">
        <ProfileSidebarData />
      </div>

      <main className="min-w-0 space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Показатели</h1>
          <p className="num mt-1 font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {metricsPeriod}
          </p>
        </div>

        {/* Метрики — растянуты на всю ширину */}
        <div className="grid grid-cols-1 gap-4">
          {metricRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 p-4">
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">{row.label}</div>
                <div className="num mt-1 font-mono text-xl text-neutral-900 dark:text-neutral-50">
                  {row.value}
                </div>
              </div>
              <div className={`num font-mono text-sm ${row.positive ? "text-emerald-600" : "text-red-500"}`}>
                {row.trend}
              </div>
            </div>
          ))}

          {/* Показатель рисков — отдельная строка на всю ширину */}
          <div className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Показатель рисков</div>
            <div className="inline-block border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700">
              {riskLevel}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {comparisonMetrics.map((m) => (
            <ComparisonBar
              key={m.label}
              label={m.label}
              mine={m.mine}
              competitors={m.competitors}
            />
          ))}
        </div>
      </main>

      <div className="flex flex-col gap-6 min-w-0">
        <AiPanel />
        <Chat />
      </div>
    </div>
  );
}