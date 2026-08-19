/**
 * /api/reviews
 *   GET  ?shopId=…&cursor=…&limit=… — one keyset page of a shop's
 *        reviews, newest first (public; response carries `nextCursor`)
 *   POST { shopId, rating, comment } — auth required; one review per
 *        (user, shop) pair (uniqueness enforced here, not in schema,
 *        because the table allows null user_id for legacy rows).
 *
 * Body of POST does NOT accept user_name — it's derived from the
 * caller's session so reviewers can't impersonate other users.
 */

export const runtime = "edge";

import { getServerContext, unauthorized } from "@/lib/auth/server";
import { clampLimit, pageAndCursor, parseCursor } from "@/lib/pagination";

interface ReviewRow {
  id: string;
  shop_id: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  comment: string;
  reply: string | null;
  reply_at: string | null;
  created_at: string;
}

function rowToReview(r: ReviewRow) {
  return {
    id: r.id,
    shopId: r.shop_id,
    userId: r.user_id,
    userName: r.user_name,
    rating: r.rating,
    comment: r.comment,
    reply: r.reply ?? undefined,
    replyAt: r.reply_at ?? undefined,
    createdAt: r.created_at,
  };
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const shopId = url.searchParams.get("shopId");
  const { db } = await getServerContext();

  // The old no-filter branch dumped every review on the platform (up
  // to 500 rows) to anyone. Its one legitimate use — aggregate rating
  // on shop cards — moved into hydrateShops' SQL long ago, so require
  // the filter now.
  if (!shopId) {
    return Response.json({ error: "shopId is required" }, { status: 400 });
  }

  const cursor = parseCursor(url.searchParams.get("cursor"));
  const limit = clampLimit(url.searchParams.get("limit"), 20, 50);
  const conditions = ["shop_id = ?"];
  const values: unknown[] = [shopId];
  if (cursor) {
    conditions.push("(created_at, id) < (?, ?)");
    values.push(cursor.createdAt, cursor.id);
  }

  const result = await db
    .prepare(
      `SELECT id, shop_id, user_id, user_name, rating, comment,
              reply, reply_at, created_at
         FROM reviews WHERE ${conditions.join(" AND ")}
         ORDER BY created_at DESC, id DESC
         LIMIT ?`,
    )
    .bind(...values, limit + 1)
    .all<ReviewRow>();

  const { page, nextCursor } = pageAndCursor(result.results ?? [], limit);
  return Response.json({ reviews: page.map(rowToReview), nextCursor });
}

export async function POST(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const body = (await request.json()) as Partial<{
    shopId: string;
    rating: number;
    comment: string;
  }>;
  if (!body.shopId || typeof body.rating !== "number" || !body.comment?.trim()) {
    return Response.json(
      { error: "shopId, rating, comment are required" },
      { status: 400 },
    );
  }
  const rating = Math.round(body.rating);
  if (rating < 1 || rating > 5) {
    return Response.json({ error: "rating must be 1..5" }, { status: 400 });
  }

  // Verify shop is approved (no reviews on pending/rejected shops).
  const shop = await db
    .prepare("SELECT id, status FROM shops WHERE id = ?")
    .bind(body.shopId)
    .first<{ id: string; status: string }>();
  if (!shop || shop.status !== "approved") {
    return Response.json({ error: "Shop not found" }, { status: 404 });
  }

  // One review per user per shop.
  const existing = await db
    .prepare(
      "SELECT id FROM reviews WHERE shop_id = ? AND user_id = ? LIMIT 1",
    )
    .bind(body.shopId, user.id)
    .first<{ id: string }>();
  if (existing) {
    return Response.json(
      { error: "You have already reviewed this shop" },
      { status: 409 },
    );
  }

  const id = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await db
    .prepare(
      `INSERT INTO reviews (id, shop_id, user_id, user_name, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, body.shopId, user.id, user.name, rating, body.comment.trim())
    .run();

  const row = await db
    .prepare(
      `SELECT id, shop_id, user_id, user_name, rating, comment,
              reply, reply_at, created_at
         FROM reviews WHERE id = ?`,
    )
    .bind(id)
    .first<ReviewRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  return Response.json({ review: rowToReview(row) }, { status: 201 });
}
