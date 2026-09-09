export const topics = [
  "Кейсы",
  "Новости",
  "Производство",
  "Торговля",
  "Ритейл",
  "E-commerce",
  "Партнёрство",
  "Зарубежный опыт",
  "Инвестиции",
  "Наставники",
  "Инсайты",
];

export type ProfileMenuItem = {
  label: string;
  href: string;
  sub?: { label: string; href: string }[];
};

export const profileMenu: ProfileMenuItem[] = [
  { label: "Записи", href: "/demo/dashboard" },
  { label: "Компания", href: "/demo/dashboard" },
  {
    label: "Каталог",
    href: "/demo/catalog",
    sub: [
      { label: "Категории", href: "/demo/catalog" },
      { label: "Товары", href: "/demo/catalog" },
      { label: "Услуги", href: "/demo/catalog" },
    ],
  },
  { label: "Показатели", href: "/demo/metrics" },
  { label: "Инструменты", href: "/demo/dashboard" },
  { label: "Запросы", href: "/demo/dashboard" },
  { label: "Сотрудничество", href: "/demo/dashboard" },
  { label: "Реклама", href: "/demo/dashboard" },
];

export const chatContacts = [
  { initials: "АК", name: "Асхат К." },
  { initials: "МТ", name: "Мадина Т." },
  { initials: "ДБ", name: "Данияр Б." },
  { initials: "ЕС", name: "Елена С." },
];

export const conversations = [
  {
    initials: "АК",
    name: "Асхат Куанышев",
    preview: "Скинь, пожалуйста, презентацию для инвесторов",
  },
  {
    initials: "МТ",
    name: "Мадина Турсунова",
    preview: "Смотрел ваши цифры за январь — впечатляет",
  },
];

export type FeedPost =
  | {
      type: "text";
      author: string;
      role: string;
      topic: string;
      time: string;
      content: string;
    }
  | {
      type: "chart";
      author: string;
      role: string;
      topic: string;
      time: string;
      caption: string;
      series: number[];
    }
  | {
      type: "doc";
      author: string;
      role: string;
      topic: string;
      time: string;
      title: string;
      subtitle: string;
    };

export const feedPosts: FeedPost[] = [
  {
    type: "text",
    author: "Данияр Бекенов",
    role: "Основатель, логистическая компания",
    topic: "Кейсы",
    time: "2 ч назад",
    content:
      "Снизили отток клиентов на 12% за квартал, изменив логику онбординга. Убрали три лишних шага регистрации и добавили персонального менеджера на первые 30 дней. Дольше всего пришлось убеждать команду продаж, что это не их зона ответственности.",
  },
  {
    type: "chart",
    author: "Елена Соколова",
    role: "CEO, сеть кофеен",
    topic: "Инсайты",
    time: "5 ч назад",
    caption: "Рост выручки за полугодие: +34%",
    series: [12, 18, 15, 22, 26, 24, 30, 28, 34, 31, 38, 41],
  },
  {
    type: "doc",
    author: "Асхат Куанышев",
    role: "Директор, производственная компания",
    topic: "Партнёрство",
    time: "вчера",
    title: "My Company Presentation",
    subtitle: "12 слайдов · ищем партнёра по дистрибуции в СНГ",
  },
];

export const products = [
  { name: "Товар 1", note: "от 12 000 ₸" },
  { name: "Товар 2", note: "от 8 500 ₸" },
  { name: "Товар 3", note: "от 21 000 ₸" },
  { name: "Товар 4", note: "от 4 200 ₸" },
  { name: "Товар 5", note: "от 15 800 ₸" },
];

export const services = [
  { name: "Услуга 1", note: "от 50 000 ₸" },
  { name: "Услуга 2", note: "от 120 000 ₸" },
  { name: "Услуга 3", note: "от 35 000 ₸" },
  { name: "Услуга 4", note: "от 90 000 ₸" },
  { name: "Услуга 5", note: "по запросу" },
];

export const overviewStats = [
  { label: "Продажи за месяц", value: "500 000", unit: "шт" },
  { label: "Эффективность", value: "83", unit: "%" },
  { label: "Тенденция", value: "+3", unit: "%" },
];

export const overviewSeries = [
  40, 42, 38, 45, 50, 48, 55, 60, 58, 63, 67, 65, 70, 74,
];

export const metricsPeriod = "01.01.2025 – 01.02.2025";

export const metricRows = [
  {
    label: "Количество продаж",
    value: "500 000 продаж",
    trend: "+3%",
    positive: true,
  },
];

export const comparisonMetrics = [
  {
    label: "Эффективность в сравнении с конкурентами в Казахстане",
    mine: 83,
    competitors: 75,
  },
  {
    label: "Эффективность в сравнении с конкурентами по миру",
    mine: 76,
    competitors: 81,
  },
  {
    label: "Эффективность продаж",
    mine: 92,
    competitors: 87,
  },
];

export const riskLevel = "Низкий";
