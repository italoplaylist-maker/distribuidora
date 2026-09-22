/**
 * The server (and Postgres session) run in UTC, but this product is used
 * exclusively in Brazil. Any "today"/"this month"/"this hour" boundary or
 * displayed clock time must be computed in Brazil's timezone explicitly —
 * relying on server-local Date methods (`.getHours()`, `.setHours(0,0,0,0)`,
 * `.getMonth()`, `toLocaleDateString` without `timeZone`, ...) silently uses
 * UTC instead and shows/buckets everything 3 hours ahead of real Brasília
 * time. Brazil has used a fixed UTC-3 offset with no DST since 2019, but we
 * still go through Intl/IANA data rather than hardcoding "-3" so this stays
 * correct if that ever changes.
 */
export const BRAZIL_TIMEZONE = "America/Sao_Paulo";

function brazilParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BRAZIL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") };
}

/** "YYYY-MM-DD" calendar date that `date` falls on in Brazil's timezone. */
export function brazilDateKey(date: Date): string {
  const { year, month, day } = brazilParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "YYYY-MM" that `date` falls on in Brazil's timezone. */
export function brazilMonthKey(date: Date): string {
  const { year, month } = brazilParts(date);
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Calendar year that `date` falls on in Brazil's timezone. */
export function brazilYear(date: Date): number {
  return brazilParts(date).year;
}

/** Hour of day (0-23) that `date` falls on in Brazil's timezone. */
export function brazilHour(date: Date): number {
  return brazilParts(date).hour;
}

/** The instant corresponding to 00:00:00 in Brazil on the calendar day containing `date` (default: now). */
export function startOfDayBrazil(date = new Date()): Date {
  return new Date(`${brazilDateKey(date)}T00:00:00-03:00`);
}

/** The instant corresponding to 00:00:00 in Brazil on the 1st of the month containing `date` (default: now). */
export function startOfMonthBrazil(date = new Date()): Date {
  return new Date(`${brazilMonthKey(date)}-01T00:00:00-03:00`);
}

/** The instant corresponding to 00:00:00 in Brazil on January 1st of `year`. */
export function startOfYearBrazil(year: number): Date {
  return new Date(`${year}-01-01T00:00:00-03:00`);
}

/**
 * Adds `days` calendar days to a Brazil-midnight instant (as returned by
 * `startOfDayBrazil`) and returns the resulting Brazil-midnight instant.
 * Safe because Brazil has no DST: every calendar day is exactly 24h.
 */
export function addDaysBrazil(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Adds `months` calendar months to a Brazil-month-start instant, returning the resulting month's start. */
export function addMonthsBrazil(date: Date, months: number): Date {
  const { year, month } = brazilParts(date);
  const total = year * 12 + (month - 1) + months;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return new Date(`${y}-${String(m).padStart(2, "0")}-01T00:00:00-03:00`);
}
