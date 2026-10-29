export const runtime = "edge";

import { forbidden, getServerContext, unauthorized } from "@/lib/auth/server";
import { clampLimit } from "@/lib/pagination";

export async function GET(request: Request) {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();
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
  const limit = clampLimit(params.get("limit"), 20, 50);
  const conditions: string[] = [];
  const values: string[] = [];
  const q = params.get("q")?.trim().slice(0, 200);
  if (q) {
    conditions.push("(o.id LIKE ? OR s.name LIKE ? OR u.name LIKE ?)");
    values.push(...Array(3).fill(`%${q}%`));
  }
  if (status !== "all") {
    conditions.push("o.status = ?");
    values.push(status);
  }
  if (params.get("category")) {
    conditions.push("o.category = ?");
    values.push(params.get("category")!);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const from =
    "FROM orders o JOIN shops s ON s.id = o.shop_id JOIN users u ON u.id = o.customer_user_id";
  const total = await db
    .prepare(`SELECT COUNT(*) AS count ${from} ${where}`)
    .bind(...values)
    .first<{ count: number }>();
  const rows = await db
    .prepare(
      `SELECT o.id, o.category, o.status, o.created_at AS createdAt,
    o.payload_json AS payload, s.name AS shopName, s.id AS shopId, u.name AS customerName
    ${from} ${where} ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`,
    )
    .bind(...values, limit, (page - 1) * limit)
    .all();
  return Response.json(
    { orders: rows.results, page, limit, total: total?.count ?? 0 },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
