import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("приводит номер с +7 к единому виду", () => {
    expect(normalizePhone("+7 999 123-45-67")).toBe("+79991234567");
  });

  it("понимает номер с восьмёркой", () => {
    expect(normalizePhone("8 (999) 123-45-67")).toBe("+79991234567");
  });

  it("понимает номер без кода страны", () => {
    expect(normalizePhone("9991234567")).toBe("+79991234567");
  });

  it("убирает лишние символы", () => {
    expect(normalizePhone("+7-999-123-45-67")).toBe("+79991234567");
  });

  it("отклоняет слишком короткий номер", () => {
    expect(normalizePhone("12345")).toBeNull();
  });

  it("отклоняет пустую строку", () => {
    expect(normalizePhone("")).toBeNull();
  });
});

describe("formatPhone", () => {
  it("форматирует российский номер", () => {
    expect(formatPhone("+79991234567")).toBe("+7 999 123-45-67");
  });

  it("возвращает исходное значение для нестандартного номера", () => {
    expect(formatPhone("123")).toBe("123");
  });
});
