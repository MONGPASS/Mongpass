/**
 * /api/recently-viewed
 *   GET                — last 12 shops the caller viewed, newest first.
 *                        Empty list (200) for anonymous users so the
 *                        signed-out home renders without a 401 round-trip.
 *   POST  { shopId }   — record a view. Upserts (user_id, shop_id) and
 *                        bumps viewed_at. Server caps the per-user
 *                        history at 12 entries by deleting the tail.
 */

export const runtime = "edge";

import { getServerContext, unauthorized } from "@/lib/auth/server";
import { hydrateShops, type ShopRow } from "@/lib/shops/dbMapper";

const MAX_PER_USER = 12;

export async function GET(): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return Response.json({ shops: [] });

  // Order by viewed_at DESC, only show approved shops (a shop the user
  // viewed when it was approved but later got rejected shouldn't keep
  // appearing in their history).
  const result = await db
    .prepare(
      `SELECT s.id, s.owner_id, s.category, s.name, s.description, s.contact_phone,
              s.address, s.open_hours, s.facebook, s.instagram, s.status,
              s.rejection_reason, s.reviewed_at, s.featured, s.is_open,
              s.bank_account, s.delivery_fee, s.created_at
         FROM recently_viewed rv
         JOIN shops s ON s.id = rv.shop_id
        WHERE rv.user_id = ? AND s.status = 'approved'
        ORDER BY rv.viewed_at DESC
        LIMIT ?`,
    )
    .bind(user.id, MAX_PER_USER)
    .all<ShopRow>();

  const shops = await hydrateShops(db, result.results ?? []);
  return Response.json({ shops });
}

export async function POST(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as { shopId?: string };
  if (!body.shopId) {
    return Response.json({ error: "shopId required" }, { status: 400 });
  }

  // Upsert: if we already have an entry for this (user, shop), bump
  // viewed_at to now; otherwise insert. Composite primary key makes
  // this a single statement using ON CONFLICT.
  await db
    .prepare(
      `INSERT INTO recently_viewed (user_id, shop_id, viewed_at)
         VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id, shop_id)
         DO UPDATE SET viewed_at = excluded.viewed_at`,
    )
    .bind(user.id, body.shopId)
    .run();

  // Trim history to MAX_PER_USER. SQLite doesn't support LIMIT in DELETE
  // directly, so we use a subquery: delete rows beyond the window of
  // top-N most recent.
  await db
    .prepare(
      `DELETE FROM recently_viewed
        WHERE user_id = ?
          AND shop_id NOT IN (
            SELECT shop_id FROM recently_viewed
             WHERE user_id = ?
             ORDER BY viewed_at DESC
             LIMIT ?
          )`,
    )
    .bind(user.id, user.id, MAX_PER_USER)
    .run();

  return Response.json({ ok: true });
}
