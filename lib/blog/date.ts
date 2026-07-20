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
