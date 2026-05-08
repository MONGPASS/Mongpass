/**
 * POST /api/orders/[id]/status — update an order's status. Allowed for
 * the shop owner (and admin). The customer can only set status to
 * 'cancelled' on a 'pending' order. Setting status_updated_at lets the
 * notification feed re-fire so the customer is alerted to the change.
 *
 * Body: { status: OrderStatus }
 */

export const runtime = "edge";

import {
  forbidden,
  getServerContext,
  notFound,
  unauthorized,
} from "@/lib/auth/server";
import { type OrderRow, rowToOrder } from "@/lib/orders/dbMapper";

const VALID_STATUSES = new Set([
  "pending",
  "received",
  "in_transit",
  "delivered",
  "cancelled",
]);

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as { status?: string };
  const next = body.status;
  if (!next || !VALID_STATUSES.has(next)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const row = await db
    .prepare(
      `SELECT id, shop_id, customer_user_id, category, status,
              status_updated_at, created_at, payload_json
         FROM orders WHERE id = ?`,
    )
    .bind(params.id)
    .first<OrderRow>();
  if (!row) return notFound("Order not found");

  const isCustomer = row.customer_user_id === user.id;
  const isAdmin = user.role === "admin";
  let isOwner = false;
  if (!isCustomer && !isAdmin) {
    const shop = await db
      .prepare("SELECT owner_id FROM shops WHERE id = ?")
      .bind(row.shop_id)
      .first<{ owner_id: string }>();
    isOwner = shop?.owner_id === user.id;
  }

  // Customer can only cancel a still-pending order; everything else is
  // shop-owner-or-admin territory.
  if (isCustomer && !isOwner && !isAdmin) {
    if (!(next === "cancelled" && row.status === "pending")) {
      return forbidden();
    }
  } else if (!isOwner && !isAdmin) {
    return forbidden();
  }

  await db
    .prepare(
      `UPDATE orders
          SET status = ?, status_updated_at = datetime('now')
        WHERE id = ?`,
    )
    .bind(next, params.id)
    .run();

  const updated = await db
    .prepare(
      `SELECT id, shop_id, customer_user_id, category, status,
              status_updated_at, created_at, payload_json
         FROM orders WHERE id = ?`,
    )
    .bind(params.id)
    .first<OrderRow>();
  if (!updated) return notFound();

  return Response.json({ order: rowToOrder(updated) });
}
