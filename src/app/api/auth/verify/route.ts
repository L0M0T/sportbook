import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { verifyCode } from "@/lib/otp";
import { OTP } from "@/lib/constants";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  phone: z.string().min(1),
  code: z.string().regex(/^\d{4}$/),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Введите код из 4 цифр" }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ error: "Некорректный номер" }, { status: 400 });
  }

  const record = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Код истёк. Запросите новый" }, { status: 400 });
  }

  if (record.attempts >= OTP.MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Слишком много неверных попыток. Запросите новый код" },
      { status: 429 },
    );
  }

  if (!verifyCode(parsed.data.code, record.codeHash)) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    const left = OTP.MAX_ATTEMPTS - record.attempts - 1;
    return NextResponse.json(
      { error: `Неверный код. Осталось попыток: ${Math.max(left, 0)}` },
      { status: 400 },
    );
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });

  if (user.deletedAt) {
    return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });
  }

  await createSession({ userId: user.id, role: user.role, phone: user.phone });

  return NextResponse.json({ ok: true, role: user.role });
}
