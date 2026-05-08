/**
 * GET /api/orders/[id] — return one order. Visible to (a) the customer
 * who placed it, (b) the owner of the shop it was placed against, or
 * (c) an admin. Anyone else gets 404 (so existence is not leaked).
 */

export const runtime = "edge";

import { getServerContext, notFound, unauthorized } from "@/lib/auth/server";
import { type OrderRow, rowToOrder } from "@/lib/orders/dbMapper";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const row = await db
    .prepare(
      `SELECT id, shop_id, customer_user_id, category, status,
              status_updated_at, created_at, payload_json
         FROM orders WHERE id = ?`,
    )
    .bind(params.id)
    .first<OrderRow>();

  if (!row) return notFound("Order not found");

  // Authorization: customer / shop owner / admin only.
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
  if (!isCustomer && !isOwner && !isAdmin) {
    return notFound("Order not found");
  }

  return Response.json({ order: rowToOrder(row) });
}
