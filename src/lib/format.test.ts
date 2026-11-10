import { describe, expect, it } from "vitest";
import { formatMoney, formatTime, plural } from "./format";

function plain(text: string): string {
  return text.replace(/\u00A0/g, " ");
}

describe("formatMoney", () => {
  it("форматирует рубли без копеек", () => {
    expect(plain(formatMoney(120_000))).toBe("1 200 ₽");
  });

  it("форматирует ноль", () => {
    expect(plain(formatMoney(0))).toBe("0 ₽");
  });
});

describe("formatTime", () => {
  it("показывает время по Москве", () => {
    expect(formatTime(new Date("2026-01-15T06:00:00.000Z"))).toBe("09:00");
  });
});

describe("plural", () => {
  const forms = ["занятие", "занятия", "занятий"] as const;

  it("выбирает форму для 1", () => {
    expect(plural(1, ...forms)).toBe("занятие");
  });

  it("выбирает форму для 2–4", () => {
    expect(plural(2, ...forms)).toBe("занятия");
    expect(plural(4, ...forms)).toBe("занятия");
  });

  it("выбирает форму для 5+", () => {
    expect(plural(5, ...forms)).toBe("занятий");
    expect(plural(11, ...forms)).toBe("занятий");
  });

  it("корректно обрабатывает 21", () => {
    expect(plural(21, ...forms)).toBe("занятие");
  });
});
