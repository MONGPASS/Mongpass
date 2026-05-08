/**
 * Favorite store — backed by /api/favorites (D1). Keyed by user, so a
 * favorite added on phone shows up on desktop. Anonymous users get an
 * empty list (no client-side persistence) — they're prompted to sign
 * in at the call site.
 *
 * In-memory cache of the favorite ids keeps the heart icon snappy:
 * the first call hits the network, subsequent reads are instant until
 * a toggle invalidates the cache.
 */

import { Shop } from "@/lib/shopStore";

let cachedIds: Set<string> | null = null;
let pendingFetch: Promise<Set<string>> | null = null;

async function fetchFavoriteIds(): Promise<Set<string>> {
  if (cachedIds) return cachedIds;
  if (pendingFetch) return pendingFetch;
  pendingFetch = (async () => {
    try {
      const res = await fetch("/api/favorites", { credentials: "same-origin" });
      if (!res.ok) {
        cachedIds = new Set();
        return cachedIds;
      }
      const data = (await res.json()) as { shopIds?: string[] };
      cachedIds = new Set(data.shopIds ?? []);
      return cachedIds;
    } catch {
      cachedIds = new Set();
      return cachedIds;
    } finally {
      pendingFetch = null;
    }
  })();
  return pendingFetch;
}

function invalidate(): void {
  cachedIds = null;
}

export async function loadFavoriteIds(
  userId: string | null,
): Promise<string[]> {
  // userId param kept for source compat; the API uses the session.
  void userId;
  const ids = await fetchFavoriteIds();
  return Array.from(ids);
}

export async function isFavorite(
  userId: string | null,
  shopId: string,
): Promise<boolean> {
  // Anonymous users can't have favorites — server returns empty.
  if (!userId) return false;
  const ids = await fetchFavoriteIds();
  return ids.has(shopId);
}

export async function addFavorite(
  userId: string | null,
  shopId: string,
): Promise<void> {
  void userId;
  const res = await fetch("/api/favorites", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shopId }),
  });
  if (res.ok) {
    if (cachedIds) cachedIds.add(shopId);
  }
}

export async function removeFavorite(
  userId: string | null,
  shopId: string,
): Promise<void> {
  void userId;
  const res = await fetch("/api/favorites", {
    method: "DELETE",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shopId }),
  });
  if (res.ok) {
    if (cachedIds) cachedIds.delete(shopId);
  }
}

/**
 * Toggle returns the *new* favorited state so callers can update their
 * heart icon without a separate read.
 */
export async function toggleFavorite(
  userId: string | null,
  shopId: string,
): Promise<boolean> {
  const currently = await isFavorite(userId, shopId);
  if (currently) {
    await removeFavorite(userId, shopId);
    return false;
  }
  await addFavorite(userId, shopId);
  return true;
}

export async function loadFavoriteShops(
  userId: string | null,
): Promise<Shop[]> {
  void userId;
  try {
    const res = await fetch("/api/favorites", { credentials: "same-origin" });
    if (!res.ok) return [];
    const data = (await res.json()) as { shops?: Shop[] };
    // Refresh the id cache too while we're here.
    cachedIds = new Set((data.shops ?? []).map((s) => s.id));
    return data.shops ?? [];
  } catch {
    return [];
  }
}

/** Clear cache — call from logout flow if you want immediate flush. */
export function clearFavoriteCache(): void {
  invalidate();
}
