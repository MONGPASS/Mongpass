/**
 * Timestamp parsing helper.
 *
 * D1 / SQLite's `datetime('now')` returns "YYYY-MM-DD HH:MM:SS" with
 * no timezone indicator — but the value IS UTC. JavaScript's
 * `new Date()` constructor handles this format inconsistently:
 * Chrome/Edge treat it as local time, which is wrong; Safari often
 * returns Invalid Date. Either way the rendered time ends up off by
 * the user's offset (9 hours behind in KST / Mongolia, etc.).
 *
 * Code that calls `new Date().toISOString()` (chat messages, orders,
 * etc.) already produces a proper ISO 8601 string with a `Z` suffix,
 * which parses fine — so we only need to normalise the bare-SQLite
 * format. This helper does both:
 *
 *   "2026-05-11T09:34:00.000Z"  → parsed as-is (UTC)
 *   "2026-05-11 09:34:00"       → space→T + Z suffix → parsed as UTC
 *
 * Always returns a `Date`; callers can use the usual getHours / etc.
 * which will convert to the viewer's local zone.
 */
export function parseTimestamp(value: string | null | undefined): Date {
  if (!value) return new Date(NaN);
  if (value.includes("T")) {
    // Already an ISO 8601 string from new Date().toISOString() or
    // similar. Trust the engine.
    return new Date(value);
  }
  // Bare SQLite format → "YYYY-MM-DD HH:MM:SS"
  return new Date(value.replace(" ", "T") + "Z");
}

/** Convenience for `.getTime()` callers (e.g. sorts, age math). */
export function parseTimestampMs(value: string | null | undefined): number {
  return parseTimestamp(value).getTime();
}

/**
 * Today's date as a local-timezone "YYYY-MM-DD" string — for `min`
 * attributes on <input type="date"> and validating booking dates.
 * NOT `toISOString().slice(0, 10)`: that's UTC, which for KST users
 * is yesterday's date until 9am.
 */
export function todayLocalISODate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
