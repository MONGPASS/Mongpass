/**
 * /api/biz/orders/unread
 *   GET — number of *pending* orders sitting against any shop the
 *         current user owns. Drives the red badge on the /biz
 *         "Захиалга" tab + the home-screen "X шинэ захиалга" banner.
 *
 * "Unread" deliberately maps to status='pending'. The owner clears it
 * by advancing the order to received/in_transit/delivered (or
 * cancelled) — no separate seen-state table is needed because the
 * status flow itself is the acknowledgement. Keeps the model simple
 * and means the badge shows actionable work, not just "new since you
 * last looked".
 *
 * Returns 0 (200) when signed out or shop-less so the polling loop in
 * the bottom nav doesn't have to special-case those.
 */

export const runtime = "edge";

import { getServerContext } from "@/lib/auth/server";

export async function GET(): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return Response.json({ count: 0 });

  const result = await db
    .prepare(
      `SELECT COUNT(*) AS n
         FROM orders o
         JOIN shops s ON s.id = o.shop_id
        WHERE s.owner_id = ?
          AND o.status = 'pending'`,
    )
    .bind(user.id)
    .first<{ n: number }>();

  return Response.json({ count: result?.n ?? 0 });
}
