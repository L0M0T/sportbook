export interface SmsProvider {
  send(phone: string, text: string): Promise<void>;
}

/**
 * Заглушка на время MVP: код печатается в консоль сервера.
 * Реальный шлюз (SMS.ru и т.п.) подключается заменой этого класса.
 */
class MockSmsProvider implements SmsProvider {
  async send(phone: string, text: string): Promise<void> {
    console.info(`[sms:mock] ${phone} → ${text}`);
  }
}

export const sms: SmsProvider = new MockSmsProvider();
