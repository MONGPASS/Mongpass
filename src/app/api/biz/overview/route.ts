export const runtime = "edge";

import { getServerContext, notFound, unauthorized } from "@/lib/auth/server";
import { hydrateShops, type ShopRow } from "@/lib/shops/dbMapper";
import type { BusinessOverview } from "@/lib/admin/business";

// Ownership always comes from the session. A query-string shop ID cannot expand access.
export async function GET(request: Request) {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  const row = await db
    .prepare(
      "SELECT * FROM shops WHERE owner_id = ? ORDER BY created_at ASC, id ASC LIMIT 1",
    )
    .bind(user.id)
    .first<ShopRow>();
  if (!row) return notFound("Shop not found");
  const days = Number(new URL(request.url).searchParams.get("days") || 7);
  if (![7, 30, 90].includes(days))
    return Response.json({ error: "Invalid days" }, { status: 400 });
  const now = new Date();
  const today = new Date(now.getTime() + 9 * 3600000)
    .toISOString()
    .slice(0, 10);
  const start = new Date(
    new Date(today + "T00:00:00+09:00").getTime() - (days - 1) * 86400000,
  );
  const from = start.toISOString().replace("T", " ").slice(0, 19);
  const counts = await db
    .prepare(
      `SELECT
    (SELECT COUNT(*) FROM orders WHERE shop_id = ?) AS orders,
    (SELECT COUNT(*) FROM chat_threads WHERE shop_id = ?) AS chats,
    (SELECT COUNT(*) FROM favorites WHERE shop_id = ?) AS favorites,
    (SELECT COUNT(*) FROM reviews WHERE shop_id = ?) AS reviews,
    (SELECT COUNT(*) FROM orders WHERE shop_id = ? AND status = 'pending') AS pending,
    (SELECT COUNT(*) FROM chat_threads WHERE shop_id = ? AND last_message_preview IS NOT NULL AND (shop_last_read_at IS NULL OR last_message_at > shop_last_read_at)) AS unread,
    (SELECT ROUND(COALESCE(AVG(rating), 0), 1) FROM reviews WHERE shop_id = ?) AS rating,
    (SELECT COUNT(*) FROM reviews WHERE shop_id = ? AND (reply IS NULL OR reply = '')) AS unreplied`,
    )
    .bind(...Array(8).fill(row.id))
    .first<BusinessOverview["totals"]>();
  const series = await db.batch<{ date: string; count: number }>(
    [
      ["orders", "created_at"],
      ["chat_threads", "last_message_at"],
      ["favorites", "created_at"],
      ["reviews", "created_at"],
    ].map(([table, time]) =>
      db
        .prepare(
          `SELECT date(${time}, '+9 hours') AS date, COUNT(*) AS count FROM ${table} WHERE shop_id = ? AND ${time} >= ? GROUP BY date(${time}, '+9 hours') ORDER BY date`,
        )
        .bind(row.id, from),
    ),
  );
  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * 86400000 + 9 * 3600000)
      .toISOString()
      .slice(0, 10);
    return {
      date,
      orders: series[0].results.find((item) => item.date === date)?.count ?? 0,
      chats: series[1].results.find((item) => item.date === date)?.count ?? 0,
      favorites:
        series[2].results.find((item) => item.date === date)?.count ?? 0,
      reviews: series[3].results.find((item) => item.date === date)?.count ?? 0,
    };
  });
  const recent = await db
    .prepare(
      `SELECT o.id, o.category, o.status, o.created_at AS createdAt, o.payload_json AS payload, u.name AS customerName
    FROM orders o JOIN users u ON u.id = o.customer_user_id WHERE o.shop_id = ? ORDER BY o.created_at DESC, o.id DESC LIMIT 5`,
    )
    .bind(row.id)
    .all<BusinessOverview["recentOrders"][number]>();
  const [shop] = await hydrateShops(db, [row]);
  return Response.json(
    {
      generatedAt: now.toISOString(),
      days,
      shop,
      totals: counts,
      daily,
      recentOrders: recent.results.map((order) => ({
        ...order,
        shopName: shop.name,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
