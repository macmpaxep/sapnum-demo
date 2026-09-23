import WaitlistForm from "./waitlist-form";

const ticker = [
  { name: "B2B SaaS", metric: "MRR", value: "+14.2%", up: true },
  { name: "Розничная сеть", metric: "Выручка", value: "−3.1%", up: false },
  { name: "Логистика", metric: "EBITDA", value: "+8.7%", up: true },
  { name: "Edtech", metric: "MAU", value: "+21.4%", up: true },
  { name: "Производство", metric: "Маржа", value: "+1.6%", up: true },
  { name: "Ресторанная сеть", metric: "Средний чек", value: "−2.4%", up: false },
];

const steps = [
  {
    n: "01",
    title: "Подключите метрики",
    text: "Загрузите цифры вручную или синхронизируйте их из своей CRM, платёжной системы или аналитики — вручную обновлять ничего не придётся.",
  },
  {
    n: "02",
    title: "Публикуйте инсайты",
    text: "Делитесь тем, что сработало и что провалилось. Решаете сами, что видно всем, а что — только выбранному кругу.",
  },
  {
    n: "03",
    title: "Сравнивайте и обсуждайте",
    text: "Смотрите, как ваши показатели выглядят на фоне похожих компаний, и разбирайте узкие места вместе с сообществом и ИИ.",
  },
];

const features = [
  {
    title: "Профиль компании",
    text: "Публичная или закрытая страница с отраслью, размером и историей роста — индексируется поисковиками, если вы этого хотите.",
  },
  {
    title: "Дашборд метрик",
    text: "Выручка, MRR, юнит-экономика, NPS — в одном месте, с гибкими настройками доступа для каждой цифры.",
  },
  {
    title: "Синхронизация данных",
    text: "Подключение к учётным и аналитическим сервисам, чтобы цифры обновлялись сами, без ручного ввода.",
  },
  {
    title: "ИИ-аналитик на базе Claude",
    text: "Спросите, почему просела маржа или как трактовать отток — ассистент разбирает именно ваши цифры, а не общие советы.",
  },
  {
    title: "Отраслевые обсуждения",
    text: "Закрытые группы по нишам — от ресторанного бизнеса до B2B SaaS — без случайных людей со стороны.",
  },
  {
    title: "Контроль приватности",
    text: "Каждая метрика публикуется отдельно: всем, только подписчикам или только выбранным партнёрам.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-ink text-paper">
      {/* Header */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-content items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-bold tracking-tight">
            SAPNUM
          </span>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="text-sm text-paper/70 transition-colors hover:text-paper"
            >
              Войти
            </a>
            <a
              href="#waitlist"
              className="border border-line px-4 py-2 text-sm text-paper transition-colors hover:border-gain hover:text-gain"
            >
              Ранний доступ
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-content gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
              Здесь бизнес разговаривает цифрами, а не питчами
            </h1>
            <p className="mt-6 max-w-md text-lg text-mute">
              Закрытая сеть для собственников и топ-менеджеров: показывайте
              реальные метрики компании, сравнивайте себя с похожими
              бизнесами и разбирайте узкие места вместе с ИИ-аналитиком на
              базе Claude.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#waitlist"
                className="bg-gain px-6 py-3 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
              >
                Оставить заявку
              </a>
              <a
                href="#how"
                className="text-sm text-mute underline decoration-line underline-offset-4 hover:text-paper"
              >
                Как это работает
              </a>
            </div>
          </div>

          <div className="border border-line bg-panel">
            <div className="border-b border-line px-4 py-3 text-xs text-mute">
              Показатели участников за последний квартал
            </div>
            <div>
              {ticker.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0"
                >
                  <div>
                    <div className="text-sm text-paper">{row.name}</div>
                    <div className="text-xs text-mute">{row.metric}</div>
                  </div>
                  <div
                    className={`num font-mono text-sm ${
                      row.up ? "text-gain" : "text-red-400"
                    }`}
                  >
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-line">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            Как это работает
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n}>
                <div className="font-mono text-sm text-gain">{step.n}</div>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            Что внутри
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="bg-ink p-6">
                <h3 className="font-display text-base font-semibold">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="border-b border-line bg-panel">
        <div className="mx-auto max-w-content px-6 py-16 md:py-20">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              Попасть в число первых 20 компаний
            </h2>
            <p className="mt-3 text-sm text-mute">
              Мы запускаемся с ограниченной группой. Оставьте контакт — и мы
              свяжемся с вами, как только откроем доступ.
            </p>
          </div>
          <div className="mt-8 max-w-xl">
            <WaitlistForm />
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-content px-6 py-8 text-xs text-mute">
        © {new Date().getFullYear()} SAPNUM
      </footer>
    </main>
  );
}
