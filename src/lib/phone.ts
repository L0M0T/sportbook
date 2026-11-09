export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  let local = digits;
  if (local.length === 11 && (local.startsWith("7") || local.startsWith("8"))) {
    local = local.slice(1);
  }
  if (local.length !== 10) return null;

  return `+7${local}`;
}

export function formatPhone(phone: string): string {
  if (!/^\+7\d{10}$/.test(phone)) return phone;
  return `+7 ${phone.slice(2, 5)} ${phone.slice(5, 8)}-${phone.slice(8, 10)}-${phone.slice(10)}`;
}
