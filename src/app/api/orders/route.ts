/**
 * /api/orders
 *   GET  — list orders (filters: ?mine=true | ?shopId=… | ?category=…)
 *          - mine=true     → caller's own orders (auth required)
 *          - shopId=xxx    → orders for a shop they own (or any if admin)
 *          - category=xxx  → admin only
 *   POST — create a new order. The customer_user_id and category come
 *          from the session and the target shop, never from the body.
 */

export const runtime = "edge";

import {
  forbidden,
  getServerContext,
  notFound,
  unauthorized,
} from "@/lib/auth/server";
import { type OrderRow, orderToPayloadJson, rowToOrder } from "@/lib/orders/dbMapper";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const mine = url.searchParams.get("mine") === "true";
  const shopId = url.searchParams.get("shopId");
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");

  const { db, user } = await getServerContext();

  // Every supported filter requires authentication; there is no
  // legitimate reason to fetch other users' orders anonymously.
  if (!user) return unauthorized();

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (mine) {
    conditions.push("customer_user_id = ?");
    values.push(user.id);
  } else if (shopId) {
    // Owner-or-admin check
    if (user.role !== "admin") {
      const shopRow = await db
        .prepare("SELECT owner_id FROM shops WHERE id = ?")
        .bind(shopId)
        .first<{ owner_id: string }>();
      if (!shopRow) return notFound("Shop not found");
      if (shopRow.owner_id !== user.id) return forbidden();
    }
    conditions.push("shop_id = ?");
    values.push(shopId);
  } else if (category) {
    if (user.role !== "admin") return forbidden();
    conditions.push("category = ?");
    values.push(category);
  } else {
    // No filter at all → only admin may dump everything
    if (user.role !== "admin") return forbidden();
  }

  if (status) {
    conditions.push("status = ?");
    values.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await db
    .prepare(
      `SELECT id, shop_id, customer_user_id, category, status,
              status_updated_at, created_at, payload_json
         FROM orders
         ${where}
         ORDER BY created_at DESC
         LIMIT 200`,
    )
    .bind(...values)
    .all<OrderRow>();

  return Response.json({ orders: (result.results ?? []).map(rowToOrder) });
}

export async function POST(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  type IncomingOrder = Record<string, unknown> & {
    shopId?: string;
    shopCategory?: string;
  };
  const body = (await request.json()) as IncomingOrder;

  if (!body.shopId || !body.shopCategory) {
    return Response.json(
      { error: "shopId and shopCategory are required" },
      { status: 400 },
    );
  }

  // Verify the shop exists and is approved (can't place orders against
  // a pending or rejected shop). The category in the body must match
  // the shop's actual category — prevents clients from spoofing.
  const shop = await db
    .prepare("SELECT id, category, status FROM shops WHERE id = ?")
    .bind(body.shopId)
    .first<{ id: string; category: string; status: string }>();
  if (!shop) return notFound("Shop not found");
  if (shop.status !== "approved") {
    return Response.json(
      { error: "Cannot place orders against an unapproved shop" },
      { status: 409 },
    );
  }

  const id = `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const orderForJson = {
    ...body,
    id,
    shopId: shop.id,
    shopCategory: shop.category,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  // orderToPayloadJson strips the columns we persist separately
  const payloadJson = orderToPayloadJson(orderForJson as never);

  await db
    .prepare(
      `INSERT INTO orders (
         id, shop_id, customer_user_id, category, status, payload_json
       ) VALUES (?, ?, ?, ?, 'pending', ?)`,
    )
    .bind(id, shop.id, user.id, shop.category, payloadJson)
    .run();

  const row = await db
    .prepare(
      `SELECT id, shop_id, customer_user_id, category, status,
              status_updated_at, created_at, payload_json
         FROM orders WHERE id = ?`,
    )
    .bind(id)
    .first<OrderRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });

  return Response.json({ order: rowToOrder(row) }, { status: 201 });
}
