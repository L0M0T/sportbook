import { describe, expect, it } from "vitest";
import { generateCode, hashCode, verifyCode } from "./otp";

describe("OTP", () => {
  it("генерирует код из четырёх цифр", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateCode()).toMatch(/^\d{4}$/);
    }
  });

  it("проверяет верный код", () => {
    const code = generateCode();
    expect(verifyCode(code, hashCode(code))).toBe(true);
  });

  it("не пропускает неверный код", () => {
    const code = generateCode();
    const wrong = code === "0000" ? "1111" : "0000";
    expect(verifyCode(wrong, hashCode(code))).toBe(false);
  });

  it("хеш не содержит исходный код в открытом виде", () => {
    const code = "1234";
    expect(hashCode(code)).not.toBe(code);
    expect(hashCode(code)).toHaveLength(64);
  });

  it("хеш детерминирован", () => {
    expect(hashCode("5678")).toBe(hashCode("5678"));
  });
});
