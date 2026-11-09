import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { generateCode, hashCode } from "@/lib/otp";
import { OTP } from "@/lib/constants";
import { sms } from "@/lib/providers/sms";

export const runtime = "nodejs";

const schema = z.object({ phone: z.string().min(1) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "Введите номер в формате +7 999 123-45-67" },
      { status: 400 },
    );
  }

  const since = new Date(Date.now() - OTP.WINDOW_MINUTES * 60_000);
  const recent = await prisma.otpCode.count({
    where: { phone, createdAt: { gte: since } },
  });

  if (recent >= OTP.MAX_PER_WINDOW) {
    return NextResponse.json(
      { error: `Слишком много попыток. Повторите через ${OTP.WINDOW_MINUTES} минут` },
      { status: 429 },
    );
  }

  const code = generateCode();
  await prisma.otpCode.create({
    data: {
      phone,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + OTP.TTL_MINUTES * 60_000),
    },
  });

  await sms.send(phone, `Код входа в SportBook: ${code}`);

  return NextResponse.json({
    ok: true,
    phone,
    // В учебном режиме показываем код на экране, чтобы не зависеть от SMS-шлюза.
    devCode: process.env.NODE_ENV !== "production" ? code : undefined,
  });
}
