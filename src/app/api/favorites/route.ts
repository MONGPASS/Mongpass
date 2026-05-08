/**
 * /api/favorites
 *   GET                — list the caller's favorite shop ids (and full
 *                        Shop records, hydrated like /api/shops). Empty
 *                        list when signed out (vs 401) so consumers
 *                        don't have to special-case the anonymous home.
 *   POST   { shopId }  — add a favorite. Idempotent.
 *   DELETE { shopId }  — remove a favorite. Idempotent.
 *
 * Each row is keyed (user_id, shop_id) so the same user has the same
 * favorites everywhere they sign in.
 */

export const runtime = "edge";

import { getServerContext, unauthorized } from "@/lib/auth/server";
import { hydrateShops, type ShopRow } from "@/lib/shops/dbMapper";

export async function GET(): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return Response.json({ shops: [], shopIds: [] });

  // Pull the join in one round-trip — favorite rows + matching shop
  // rows ordered by favorite recency.
  const result = await db
    .prepare(
      `SELECT s.id, s.owner_id, s.category, s.name, s.description, s.contact_phone,
              s.address, s.open_hours, s.facebook, s.instagram, s.status,
              s.rejection_reason, s.reviewed_at, s.featured, s.is_open,
              s.bank_account, s.delivery_fee, s.created_at
         FROM favorites f
         JOIN shops s ON s.id = f.shop_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
        LIMIT 200`,
    )
    .bind(user.id)
    .all<ShopRow>();

  const shops = await hydrateShops(db, result.results ?? []);
  return Response.json({
    shops,
    shopIds: shops.map((s) => s.id),
  });
}

export async function POST(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as { shopId?: string };
  if (!body.shopId) {
    return Response.json({ error: "shopId required" }, { status: 400 });
  }

  // INSERT OR IGNORE makes the call idempotent — repeated favorites
  // just no-op rather than collide on the composite primary key.
  await db
    .prepare(
      `INSERT OR IGNORE INTO favorites (user_id, shop_id) VALUES (?, ?)`,
    )
    .bind(user.id, body.shopId)
    .run();

  return Response.json({ ok: true, favorite: true });
}

export async function DELETE(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as { shopId?: string };
  if (!body.shopId) {
    return Response.json({ error: "shopId required" }, { status: 400 });
  }

  await db
    .prepare("DELETE FROM favorites WHERE user_id = ? AND shop_id = ?")
    .bind(user.id, body.shopId)
    .run();

  return Response.json({ ok: true, favorite: false });
}
