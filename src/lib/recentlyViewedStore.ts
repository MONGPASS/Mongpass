/**
 * Recently viewed shops — backed by /api/recently-viewed (D1). Server
 * caps history at 12 per user; anonymous viewers don't track history
 * (the localStorage anon bucket is gone with the migration).
 */

import { Shop } from "@/lib/shopStore";

/**
 * Record a shop view. Fire-and-forget — failures don't propagate
 * because a missed history entry shouldn't block the page navigation
 * that triggered it. userId param is kept for source compat (the API
 * uses the session); pass null to skip the request entirely for
 * signed-out users.
 */
export async function recordShopView(
  userId: string | null,
  shopId: string,
): Promise<void> {
  if (!userId) return;
  try {
    await fetch("/api/recently-viewed", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId }),
    });
  } catch {
    /* swallow — see comment above */
  }
}

/**
 * Resolve recently-viewed entries to the full Shop records, in
 * recency order. The server already returns hydrated Shops via
 * hydrateShops, so the client doesn't have to look them up by id.
 */
export async function loadRecentlyViewedShops(
  userId: string | null,
): Promise<Shop[]> {
  void userId;
  try {
    const res = await fetch("/api/recently-viewed", {
      credentials: "same-origin",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { shops?: Shop[] };
    return data.shops ?? [];
  } catch {
    return [];
  }
}
