const TIME_ZONE = "Europe/Moscow";

const dateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Полночь по Москве со сдвигом на offsetDays дней.
 * Москва живёт в UTC+3 круглый год, поэтому смещение фиксированное.
 */
export function moscowMidnight(offsetDays = 0): Date {
  const [year, month, day] = dateParts
    .format(new Date())
    .split("-")
    .map(Number);

  return new Date(Date.UTC(year, month - 1, day + offsetDays, -3, 0, 0, 0));
}

export function moscowAt(offsetDays: number, hour: number, minute = 0): Date {
  return new Date(
    moscowMidnight(offsetDays).getTime() +
      hour * 3_600_000 +
      minute * 60_000,
  );
}
