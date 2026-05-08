import { Shop, loadShops } from "@/lib/shopStore";

/**
 * Per-user "recently viewed shop IDs" history. Capped to MAX_ITEMS to
 * keep localStorage small. Newest first.
 */

const KEY_PREFIX = "mongpass:recently-viewed:";
const MAX_ITEMS = 12;

function key(userId: string | null): string {
  return `${KEY_PREFIX}${userId ?? "anon"}`;
}

interface Entry {
  shopId: string;
  viewedAt: string; // ISO
}

function load(userId: string | null): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Entry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(userId: string | null, entries: Entry[]): void {
  if (typeof window === "undefined") return;
  if (entries.length === 0) {
    window.localStorage.removeItem(key(userId));
  } else {
    window.localStorage.setItem(key(userId), JSON.stringify(entries));
  }
}

/**
 * Record a shop view. Moves the shop to the top if already present, or
 * inserts at the top. Trims to MAX_ITEMS.
 */
export function recordShopView(userId: string | null, shopId: string): void {
  const entries = load(userId).filter((e) => e.shopId !== shopId);
  entries.unshift({ shopId, viewedAt: new Date().toISOString() });
  save(userId, entries.slice(0, MAX_ITEMS));
}

/**
 * Resolve recently-viewed IDs to actual approved Shop records,
 * preserving the recency order.
 */
export async function loadRecentlyViewedShops(userId: string | null): Promise<Shop[]> {
  const entries = load(userId);
  if (entries.length === 0) return [];
  const allShops = await loadShops();
  const byId = new Map(allShops.map((s) => [s.id, s]));
  return entries
    .map((e) => byId.get(e.shopId))
    .filter((s): s is Shop => Boolean(s));
}
