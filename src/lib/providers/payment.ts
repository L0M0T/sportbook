import { randomUUID } from "node:crypto";

export type PaymentResult = {
  ok: boolean;
  externalId: string;
};

export interface PaymentProvider {
  pay(input: { amountCents: number; description: string }): Promise<PaymentResult>;
}

/**
 * Заглушка эквайринга: платёж всегда успешен.
 * Реальный провайдер (ЮKassa и т.п.) подключается заменой этого класса,
 * бизнес-логика и интерфейс не меняются.
 */
class MockPaymentProvider implements PaymentProvider {
  async pay(input: {
    amountCents: number;
    description: string;
  }): Promise<PaymentResult> {
    console.info(
      `[payment:mock] ${input.description} — ${input.amountCents / 100} ₽`,
    );
    return { ok: true, externalId: `mock_${randomUUID()}` };
  }
}

export const payment: PaymentProvider = new MockPaymentProvider();
