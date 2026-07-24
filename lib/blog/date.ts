/**
 * Date handling for the blog — one strategy, documented once.
 * =========================================================================
 * STORAGE: `published_at` is a Postgres `timestamptz` — a UTC instant. The
 * admin form submits an offset-aware ISO string, so a chosen wall-clock time
 * is pinned to one exact moment and never shifts with DST or server locale.
 *
 * DISPLAY: instants are formatted in a single fixed business zone
 * (America/New_York) so every visitor sees the same published date regardless
 * of their own device zone, and a post published at, say, 9:30 PM ET never
 * renders as "the next day" for a UTC/European viewer.
 *
 * LEGACY date-only strings ("2026-02-03", used by the placeholder data) carry
 * no time or zone; we treat them as calendar dates and format them without any
 * zone conversion so they can't slip a day.
 */
export const DISPLAY_TIME_ZONE = "America/New_York";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** "February 3, 2026" — zone-stable. Accepts a UTC instant or a date-only string. */
export function formatPublishedDate(iso: string): string {
  const dateOnly = DATE_ONLY.test(iso);
  const d = dateOnly ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: dateOnly ? "UTC" : DISPLAY_TIME_ZONE,
  });
}

/** Value for a <time dateTime="…"> attribute — always a full UTC instant. */
export function isoDateTimeAttr(iso: string): string {
  const d = DATE_ONLY.test(iso) ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/**
 * Admin publish-date timezone bridge.
 * =========================================================================
 * The public site DISPLAYS dates in DISPLAY_TIME_ZONE (America/New_York). For
 * "the exact date the admin picked" to appear publicly, the admin's wall-clock
 * MUST be interpreted in the SAME zone — otherwise a datetime-local read in the
 * admin's *browser* zone and rendered back in ET can slip a day near midnight
 * (the reported bug). These two helpers convert between a `datetime-local`
 * value ("YYYY-MM-DDTHH:mm", zone-naive) and a UTC instant, anchoring the
 * wall-clock to DISPLAY_TIME_ZONE. DST is handled correctly via Intl (the real
 * offset at that instant) — no hardcoded ±hours.
 */

/** The offset (ms) of `tz` at a given UTC instant: (wall-clock in tz) − UTC. */
function tzOffsetMs(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(dtf.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asUtc - utcMs;
}

/** datetime-local value (wall-clock in DISPLAY_TIME_ZONE) → UTC ISO instant. */
export function zonedInputToIso(localValue: string): string | null {
  if (!localValue) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(localValue);
  if (!m) return null;
  const [, y, mo, da, h, mi] = m.map(Number) as unknown as number[];
  // Treat the parts as if UTC, then subtract the zone offset at that instant.
  // One re-evaluation at the candidate handles DST-boundary transitions.
  const guess = Date.UTC(y, mo - 1, da, h, mi);
  const candidate = guess - tzOffsetMs(guess, DISPLAY_TIME_ZONE);
  const instant = guess - tzOffsetMs(candidate, DISPLAY_TIME_ZONE);
  return new Date(instant).toISOString();
}

/** UTC ISO instant → datetime-local value (wall-clock in DISPLAY_TIME_ZONE). */
export function isoToZonedInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(dtf.formatToParts(d).map((x) => [x.type, x.value]));
  const hour = String(+p.hour % 24).padStart(2, "0");
  return `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}`;
}
