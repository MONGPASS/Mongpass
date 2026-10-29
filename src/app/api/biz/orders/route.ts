export const runtime = "edge";

import { getServerContext, notFound, unauthorized } from "@/lib/auth/server";
import { clampLimit } from "@/lib/pagination";

export async function GET(request: Request) {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  const shop = await db
    .prepare(
      "SELECT id, name FROM shops WHERE owner_id = ? ORDER BY created_at ASC, id ASC LIMIT 1",
    )
    .bind(user.id)
    .first<{ id: string; name: string }>();
  if (!shop) return notFound("Shop not found");
  const params = new URL(request.url).searchParams;
  const status = params.get("status") || "all";
  if (
    ![
      "all",
      "pending",
      "received",
      "in_transit",
      "delivered",
      "cancelled",
    ].includes(status)
  )
    return Response.json({ error: "Invalid status" }, { status: 400 });
  const page = Math.max(
    1,
    Math.min(100000, Math.floor(Number(params.get("page")) || 1)),
  );
  const limit = clampLimit(params.get("limit"), 15, 50);
  const where = ["o.shop_id = ?"];
  const values = [shop.id];
  const q = params.get("q")?.trim().slice(0, 200);
  if (q) {
    where.push("(o.id LIKE ? OR u.name LIKE ?)");
    values.push(`%${q}%`, `%${q}%`);
  }
  if (status !== "all") {
    where.push("o.status = ?");
    values.push(status);
  }
  const base = `FROM orders o JOIN users u ON u.id = o.customer_user_id WHERE ${where.join(" AND ")}`;
  const total = await db
    .prepare(`SELECT COUNT(*) AS count ${base}`)
    .bind(...values)
    .first<{ count: number }>();
  const orders = await db
    .prepare(
      `SELECT o.id, o.category, o.status, o.created_at AS createdAt, o.payload_json AS payload, u.name AS customerName ${base} ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`,
    )
    .bind(...values, limit, (page - 1) * limit)
    .all();
  return Response.json(
    {
      orders: orders.results.map((order) => ({
        ...order,
        shopName: shop.name,
      })),
      page,
      limit,
      total: total?.count ?? 0,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
