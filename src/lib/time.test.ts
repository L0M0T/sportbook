import { describe, expect, it } from "vitest";
import { dayKey, formatTime } from "./format";
import { moscowAt, moscowMidnight } from "./time";

describe("moscowMidnight", () => {
  it("возвращает полночь по Москве", () => {
    const midnight = moscowMidnight(0);
    expect(dayKey(midnight)).toBe(dayKey(new Date()));
    expect(formatTime(midnight)).toBe("00:00");
  });

  it("сдвигает дату на заданное число дней", () => {
    const today = moscowMidnight(0);
    const tomorrow = moscowMidnight(1);
    expect(tomorrow.getTime() - today.getTime()).toBe(86_400_000);
  });
});

describe("moscowAt", () => {
  it("ставит тренировку на 09:00 МСК", () => {
    expect(formatTime(moscowAt(0, 9))).toBe("09:00");
  });

  it("ставит тренировку на 18:30 МСК", () => {
    expect(formatTime(moscowAt(0, 18, 30))).toBe("18:30");
  });

  it("не зависит от часового пояса сервера", () => {
    const at = moscowAt(2, 20);
    expect(at.toISOString()).toBe(
      new Date(moscowMidnight(2).getTime() + 20 * 3_600_000).toISOString(),
    );
  });
});
