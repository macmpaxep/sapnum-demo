// Single source of truth for application types. DB enum values stay stable;
// only the wording changes. Named by what the sender wants, not by document form.
export const APPLICATION_TYPES = {
  distributor: {
    label: "Хочу продавать ваши товары",
    short: "Дилерство",
    hint: "Вы хотите перепродавать продукцию этой компании в своём регионе или канале.",
  },
  commercial_offer: {
    label: "Предложить свои товары или услуги",
    short: "Предложение поставки",
    hint: "Вы поставляете или оказываете то, что может понадобиться этой компании.",
  },
  partnership: {
    label: "Совместный проект",
    short: "Совместный проект",
    hint: "Общий бизнес, совместное производство или другое сотрудничество.",
  },
  investment: {
    label: "Инвестировать",
    short: "Инвестиции",
    hint: "Вы хотите вложиться в компанию. Укажите сумму и условия.",
  },
  purchase: {
    label: "Заказ или запрос цены",
    short: "Заказ / запрос цены",
    hint: "Покупатель хочет заказать товар или узнать цену.",
  },
} as const;

export type ApplicationTypeKey = keyof typeof APPLICATION_TYPES;

export const shortTypeLabel = (type: string) => APPLICATION_TYPES[type as ApplicationTypeKey]?.short ?? type;

// Types a visitor can pick in the cooperation form, in the order they're shown.
export const COOPERATION_TYPES: ApplicationTypeKey[] = ["distributor", "commercial_offer", "partnership", "investment"];
