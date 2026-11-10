import { describe, expect, it } from "vitest";
import { PLANS, getPlan } from "./plans";

describe("PLANS", () => {
  it("содержит четыре тарифа", () => {
    expect(PLANS).toHaveLength(4);
  });

  it("идентификаторы уникальны", () => {
    const ids = PLANS.map((plan) => plan.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("у каждого тарифа есть занятия, цена и срок", () => {
    for (const plan of PLANS) {
      expect(plan.lessons).toBeGreaterThan(0);
      expect(plan.priceCents).toBeGreaterThan(0);
      expect(plan.days).toBeGreaterThan(0);
    }
  });

  it("чем больше занятий, тем дешевле занятие", () => {
    const perLesson = PLANS.map((plan) => plan.priceCents / plan.lessons);
    for (let i = 1; i < perLesson.length; i += 1) {
      expect(perLesson[i]).toBeLessThan(perLesson[i - 1]);
    }
  });
});

describe("getPlan", () => {
  it("находит тариф по id", () => {
    expect(getPlan("optimum")?.name).toBe("Оптимум");
  });

  it("возвращает undefined для неизвестного id", () => {
    expect(getPlan("nope")).toBeUndefined();
  });
});
