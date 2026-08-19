/**
 * GET /api/me/badges — every red-dot count the UI polls for, in one
 * request. Replaces the separate /api/chat/unread and
 * /api/biz/orders/unread round trips (both kept for compatibility):
 * badge polling is the app's chattiest traffic, so halving the request
 * count here directly halves the standing Functions + D1 bill.
 *
 * Returns zeros (200) for unauthenticated callers so pollers don't
 * have to special-case the signed-out state.
 */

export const runtime = "edge";

import { getServerContext } from "@/lib/auth/server";

export async function GET(): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) {
    return Response.json({ chatUnread: 0, bizPendingOrders: 0 });
  }

  // One D1 batch = one round trip for both counts.
  //
  // chatUnread: threads with activity newer than the caller's last-read
  // stamp, counted on both sides they can occupy (customer on their own
  // threads, owner on threads against their shops — the two sets can't
  // overlap for a single thread).
  //
  // bizPendingOrders: orders sitting in 'pending' against any shop the
  // caller owns; advancing the status is what clears the badge.
  const [chat, orders] = await db.batch([
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM (
           SELECT 1
             FROM chat_threads
            WHERE user_id = ?1
              AND (user_last_read_at IS NULL OR last_message_at > user_last_read_at)
              AND last_message_preview IS NOT NULL
           UNION ALL
           SELECT 1
             FROM chat_threads t
             JOIN shops s ON s.id = t.shop_id
            WHERE s.owner_id = ?1
              AND (t.shop_last_read_at IS NULL OR t.last_message_at > t.shop_last_read_at)
              AND t.last_message_preview IS NOT NULL
         )`,
      )
      .bind(user.id),
    db
      .prepare(
        `SELECT COUNT(*) AS n
           FROM orders o
           JOIN shops s ON s.id = o.shop_id
          WHERE s.owner_id = ?
            AND o.status = 'pending'`,
      )
      .bind(user.id),
  ]);

  const chatUnread =
    (chat.results?.[0] as { n: number } | undefined)?.n ?? 0;
  const bizPendingOrders =
    (orders.results?.[0] as { n: number } | undefined)?.n ?? 0;

  return Response.json({ chatUnread, bizPendingOrders });
}
