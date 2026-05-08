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

  // Always evaluate ownership — a user who placed an order on their own
  // shop is *both* customer and owner, and we want owner privileges to
  // win (so they can advance status while testing). Skipping this lookup
  // when isCustomer is true would forbid that legitimate path.
  const isCustomer = row.customer_user_id === user.id;
  const isAdmin = user.role === "admin";
  const shopRow = await db
    .prepare("SELECT owner_id FROM shops WHERE id = ?")
    .bind(row.shop_id)
    .first<{ owner_id: string }>();
  const isOwner = shopRow?.owner_id === user.id;

  // Owner / admin: any status. Customer-only: cancel from pending.
  // Anyone else: forbidden.
  if (!isOwner && !isAdmin) {
    if (!isCustomer) return forbidden();
    if (!(next === "cancelled" && row.status === "pending")) {
      return forbidden();
    }
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
