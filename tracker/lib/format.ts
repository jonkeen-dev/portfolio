const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function zoneOrUtc(timeZone: string): string {
  try {
    Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

/** "Wed, Oct 21" for a calendar date, without shifting the day. */
export function formatWeekdayDate(iso: string, locale = "en-US"): string {
  const date = calendarDate(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function calendarDate(iso: string): Date | null {
  const match = DATE_ONLY.exec(iso);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
}

/** Calendar date (YYYY-MM-DD) in the reader's locale, without shifting the day. */
export function formatCalendarDate(iso: string, locale = "en-US"): string {
  const date = calendarDate(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatInstantDate(value: Date, timeZone: string, locale = "en-US"): string {
  const zone = zoneOrUtc(timeZone);
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
  return formatCalendarDate(iso, locale);
}

/** "Today 12:51 AM" when the instant falls on the current local day. */
export function formatZonedDateTime(value: Date, timeZone: string, locale = "en-US", now = new Date()): string {
  const zone = zoneOrUtc(timeZone);
  const dayKey = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  const time = new Intl.DateTimeFormat(locale, {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
  if (dayKey(value) === dayKey(now)) return `Today ${time}`;
  const date = new Intl.DateTimeFormat(locale, {
    timeZone: zone,
    month: "short",
    day: "numeric",
  }).format(value);
  return `${date}, ${time}`;
}
