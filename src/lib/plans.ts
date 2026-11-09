export type Plan = {
  id: string;
  name: string;
  lessons: number;
  priceCents: number;
  days: number;
  note: string;
};

export const PLANS: Plan[] = [
  {
    id: "single",
    name: "Разовое занятие",
    lessons: 1,
    priceCents: 90_000,
    days: 7,
    note: "Попробовать формат без обязательств",
  },
  {
    id: "start",
    name: "Старт",
    lessons: 4,
    priceCents: 320_000,
    days: 30,
    note: "Одна тренировка в неделю",
  },
  {
    id: "optimum",
    name: "Оптимум",
    lessons: 8,
    priceCents: 560_000,
    days: 45,
    note: "Две тренировки в неделю — самый популярный",
  },
  {
    id: "max",
    name: "Максимум",
    lessons: 12,
    priceCents: 720_000,
    days: 60,
    note: "Три тренировки в неделю",
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}
