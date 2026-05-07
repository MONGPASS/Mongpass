import { Shop, loadShops } from "@/lib/shopStore";

/**
 * Per-user favorite shop IDs. Stored under a key suffixed with userId so
 * different logged-in users have separate favorites on the same browser.
 *
 * Anonymous (logged-out) users get a single shared "anon" bucket — good
 * enough for the demo. Real auth would tie this to user_id in the DB.
 */

const KEY_PREFIX = "mongpass:favorites:";

function key(userId: string | null): string {
  return `${KEY_PREFIX}${userId ?? "anon"}`;
}

export function loadFavoriteIds(userId: string | null): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavoriteIds(userId: string | null, ids: string[]): void {
  if (typeof window === "undefined") return;
  if (ids.length === 0) {
    window.localStorage.removeItem(key(userId));
  } else {
    window.localStorage.setItem(key(userId), JSON.stringify(ids));
  }
}

export function isFavorite(userId: string | null, shopId: string): boolean {
  return loadFavoriteIds(userId).includes(shopId);
}

export function addFavorite(userId: string | null, shopId: string): void {
  const ids = loadFavoriteIds(userId);
  if (ids.includes(shopId)) return;
  saveFavoriteIds(userId, [shopId, ...ids]);
}

export function removeFavorite(userId: string | null, shopId: string): void {
  saveFavoriteIds(userId, loadFavoriteIds(userId).filter((id) => id !== shopId));
}

export function toggleFavorite(userId: string | null, shopId: string): boolean {
  if (isFavorite(userId, shopId)) {
    removeFavorite(userId, shopId);
    return false;
  }
  addFavorite(userId, shopId);
  return true;
}

/** Resolve favorite IDs to actual Shop records (approved only). */
export function loadFavoriteShops(userId: string | null): Shop[] {
  const ids = new Set(loadFavoriteIds(userId));
  return loadShops().filter((s) => ids.has(s.id) && s.status === "approved");
}
