export const runtime = "edge";

import { forbidden, getServerContext, unauthorized } from "@/lib/auth/server";
import { hydrateShops, type ShopRow } from "@/lib/shops/dbMapper";
import { clampLimit } from "@/lib/pagination";

export async function GET(request: Request) {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();
  const params = new URL(request.url).searchParams;
  const status = params.get("status") || "all";
  if (!["all", "pending", "approved", "rejected"].includes(status))
    return Response.json({ error: "Invalid status" }, { status: 400 });
  const page = Math.max(
    1,
    Math.min(100000, Math.floor(Number(params.get("page")) || 1)),
  );
  const limit = clampLimit(params.get("limit"), 15, 50);
  const conditions: string[] = [];
  const values: string[] = [];
  const q = params.get("q")?.trim().slice(0, 200);
  if (q) {
    conditions.push("(s.name LIKE ? OR u.name LIKE ? OR u.email LIKE ?)");
    values.push(...Array(3).fill(`%${q}%`));
  }
  if (params.get("category")) {
    conditions.push("s.category = ?");
    values.push(params.get("category")!);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const buckets = await db
    .prepare(
      `SELECT s.status, COUNT(*) AS count FROM shops s JOIN users u ON u.id = s.owner_id ${where} GROUP BY s.status`,
    )
    .bind(...values)
    .all<{ status: string; count: number }>();
  const counts = { all: 0, pending: 0, approved: 0, rejected: 0 };
  buckets.results.forEach((row) => {
    counts[row.status as keyof typeof counts] = row.count;
    counts.all += row.count;
  });
  if (status !== "all") {
    conditions.push("s.status = ?");
    values.push(status);
  }
  const filteredWhere = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const rows = await db
    .prepare(
      `SELECT s.*, u.name AS owner_name, u.email AS owner_email FROM shops s JOIN users u ON u.id = s.owner_id
    ${filteredWhere} ORDER BY s.created_at DESC, s.id DESC LIMIT ? OFFSET ?`,
    )
    .bind(...values, limit, (page - 1) * limit)
    .all<ShopRow & { owner_name: string; owner_email: string }>();
  const shops = await hydrateShops(db, rows.results);
  return Response.json(
    {
      shops: shops.map((shop, index) => ({
        ...shop,
        ownerName: rows.results[index].owner_name,
        ownerEmail: rows.results[index].owner_email,
      })),
      counts,
      page,
      limit,
      total: counts[status as keyof typeof counts],
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
