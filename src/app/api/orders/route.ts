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

import { getRequestContext } from "@cloudflare/next-on-pages";
import {
  forbidden,
  getServerContext,
  notFound,
  unauthorized,
} from "@/lib/auth/server";
import { type OrderRow, orderToPayloadJson, rowToOrder } from "@/lib/orders/dbMapper";
import { sendPushToUser } from "@/lib/push/server";

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
  if (!user) {
    return Response.json(
      { error: "Authentication required", code: "unauthenticated" },
      { status: 401 },
    );
  }

  type IncomingOrder = Record<string, unknown> & {
    shopId?: string;
    shopCategory?: string;
  };
  const body = (await request.json()) as IncomingOrder;

  if (!body.shopId || !body.shopCategory) {
    return Response.json(
      { error: "shopId and shopCategory are required", code: "invalid" },
      { status: 400 },
    );
  }

  // Verify the shop exists, is approved, and is currently open. The
  // category in the body must match the shop's actual category —
  // prevents clients from spoofing.
  const shop = await db
    .prepare(
      "SELECT id, owner_id, category, status, is_open FROM shops WHERE id = ?",
    )
    .bind(body.shopId)
    .first<{
      id: string;
      owner_id: string;
      category: string;
      status: string;
      is_open: number;
    }>();
  if (!shop) {
    return Response.json(
      { error: "Shop not found", code: "shop_not_found" },
      { status: 404 },
    );
  }
  if (shop.status !== "approved") {
    return Response.json(
      {
        error: "Cannot place orders against an unapproved shop",
        code: "shop_not_approved",
      },
      { status: 409 },
    );
  }
  // The customer-facing CTA already hides the order button on a closed
  // shop; enforce it here too so a direct link (or a shop that closed
  // mid-checkout) can't slip an order past the owner.
  if (!shop.is_open) {
    return Response.json(
      { error: "Shop is currently closed", code: "shop_closed" },
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

  // Ping the owner's phone about the new order — after the response,
  // so push-service latency never slows down checkout.
  try {
    const { env, ctx } = getRequestContext();
    ctx.waitUntil(
      sendPushToUser(db, env as unknown as CloudflareEnv, shop.owner_id),
    );
  } catch {
    /* push is best-effort */
  }

  return Response.json({ order: rowToOrder(row) }, { status: 201 });
}
