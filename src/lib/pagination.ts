/**
 * Keyset ("cursor") pagination helpers shared by list APIs.
 *
 * Every hard `LIMIT n` list in the app used to silently truncate: once
 * a table outgrew the cap, older rows just stopped existing as far as
 * the UI could tell. Keyset pagination fixes that without OFFSET's
 * degrading scan cost: the cursor is the (created_at, id) pair of the
 * last row served, and the next page is everything strictly older.
 *
 * Cursor wire format: "<created_at>|<id>" — `|` appears in neither
 * SQLite datetime strings, ISO timestamps, nor our generated ids.
 */

export interface Cursor {
  createdAt: string;
  id: string;
}

export function parseCursor(raw: string | null): Cursor | null {
  if (!raw) return null;
  const idx = raw.lastIndexOf("|");
  if (idx <= 0 || idx === raw.length - 1) return null;
  return { createdAt: raw.slice(0, idx), id: raw.slice(idx + 1) };
}

export function makeCursor(createdAt: string, id: string): string {
  return `${createdAt}|${id}`;
}

/** Parse ?limit= with a default and a hard ceiling. */
export function clampLimit(
  raw: string | null,
  fallback: number,
  max: number,
): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}

/**
 * Fetch-one-extra pattern: given `limit + 1` rows, return the page and
 * the cursor for the next one (null when this was the last page).
 */
export function pageAndCursor<T extends { created_at: string; id: string }>(
  rows: T[],
  limit: number,
): { page: T[]; nextCursor: string | null } {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return {
    page,
    nextCursor: hasMore && last ? makeCursor(last.created_at, last.id) : null,
  };
}
