/**
 * The server (and Postgres session) run in UTC, but this product is used
 * exclusively in Brazil. Any "today"/"this month"/"this hour" boundary or
 * displayed clock time must account for that explicitly — relying on
 * server-local Date methods (`.getHours()`, `.setHours(0,0,0,0)`,
 * `.getMonth()`, `toLocaleDateString` without adjustment, ...) silently
 * uses UTC instead and shows/buckets everything 3 hours ahead of real
 * Brasília time. Same bug already documented in the Second Brain
 * ("Horário exibido sai adiantado quando o servidor roda em UTC") from a
 * previous project — see that note for the full writeup.
 *
 * Brazil (America/Sao_Paulo) has used a fixed UTC-3 offset with no DST
 * since 2019, so the fix is a fixed offset applied by hand, read back with
 * the `UTC` Date methods — deliberately not `Intl.DateTimeFormat`/
 * `toLocaleString`, which depend on the Node build's ICU data and would
 * behave differently in a browser if any of this were ever called from a
 * Client Component (a real hydration-mismatch risk, per that same note).
 */
const BRAZIL_UTC_OFFSET_MS = -3 * 60 * 60 * 1000;
export const BRAZIL_TIMEZONE = "America/Sao_Paulo";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** `date` shifted so reading it back with `getUTC*` methods yields Brazil's wall-clock fields. */
function toBrazilWallClock(date: Date): Date {
  return new Date(date.getTime() + BRAZIL_UTC_OFFSET_MS);
}

/** "YYYY-MM-DD" calendar date that `date` falls on in Brazil's timezone. */
export function brazilDateKey(date: Date): string {
  const d = toBrazilWallClock(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** "YYYY-MM" that `date` falls on in Brazil's timezone. */
export function brazilMonthKey(date: Date): string {
  const d = toBrazilWallClock(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

/** Calendar year that `date` falls on in Brazil's timezone. */
export function brazilYear(date: Date): number {
  return toBrazilWallClock(date).getUTCFullYear();
}

/** Hour of day (0-23) that `date` falls on in Brazil's timezone. */
export function brazilHour(date: Date): number {
  return toBrazilWallClock(date).getUTCHours();
}

/** "dd/mm/aaaa, hh:mm" for `date` in Brazil's timezone — for on-screen display. */
export function formatBrazilDateTime(date: Date): string {
  const d = toBrazilWallClock(date);
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** The instant corresponding to 00:00:00 in Brazil on the calendar day containing `date` (default: now). */
export function startOfDayBrazil(date = new Date()): Date {
  const wall = toBrazilWallClock(date);
  const midnightWallAsUtc = Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate());
  return new Date(midnightWallAsUtc - BRAZIL_UTC_OFFSET_MS);
}

/** The instant corresponding to 00:00:00 in Brazil on the 1st of the month containing `date` (default: now). */
export function startOfMonthBrazil(date = new Date()): Date {
  const wall = toBrazilWallClock(date);
  const monthStartWallAsUtc = Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), 1);
  return new Date(monthStartWallAsUtc - BRAZIL_UTC_OFFSET_MS);
}

/** The instant corresponding to 00:00:00 in Brazil on January 1st of `year`. */
export function startOfYearBrazil(year: number): Date {
  return new Date(Date.UTC(year, 0, 1) - BRAZIL_UTC_OFFSET_MS);
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
  const wall = toBrazilWallClock(date);
  const total = wall.getUTCFullYear() * 12 + wall.getUTCMonth() + months;
  const y = Math.floor(total / 12);
  const m = total % 12;
  return new Date(Date.UTC(y, m, 1) - BRAZIL_UTC_OFFSET_MS);
}
