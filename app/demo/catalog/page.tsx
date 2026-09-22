import ProfileSidebarData from "@/components/demo/ProfileSidebarData";
import AiPanel from "@/components/demo/AiPanel";
import Chat from "@/components/demo/Chat";
import { products, services } from "@/lib/demo-data";

function ItemGrid({ items }: { items: { name: string; note: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.name} className="text-center">
          <div className="aspect-square border border-neutral-200 bg-neutral-50" />
          <div className="mt-2 text-xs font-medium text-neutral-900">
            {item.name}
          </div>
          <div className="text-xs text-neutral-500">{item.note}</div>
        </div>
      ))}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
      <div className="lg:col-start-1">
        <ProfileSidebarData />
      </div>

      <main className="min-w-0 space-y-8">
        <h1 className="text-lg font-semibold text-neutral-900">Каталог</h1>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-900">Товары</h2>
            <button className="text-xs text-neutral-500 hover:text-neutral-900">
              Раскрыть
            </button>
          </div>
          <ItemGrid items={products} />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-900">Услуги</h2>
            <button className="text-xs text-neutral-500 hover:text-neutral-900">
              Раскрыть
            </button>
          </div>
          <ItemGrid items={services} />
        </section>

        <button className="border border-dashed border-neutral-300 px-4 py-2.5 text-sm text-neutral-600 hover:border-neutral-400 hover:text-neutral-900">
          + Добавить товар / услугу
        </button>
      </main>

      <div className="flex flex-col gap-6 min-w-0">
        <AiPanel />
        <Chat />
      </div>
    </div>
  );
}