import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const secret = process.env.AUTH_SECRET ?? "dev-only-insecure-secret";

export function generateCode(): string {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}

export function hashCode(code: string): string {
  return createHmac("sha256", secret).update(code).digest("hex");
}

export function verifyCode(code: string, hash: string): boolean {
  const left = Buffer.from(hashCode(code), "utf8");
  const right = Buffer.from(hash, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
