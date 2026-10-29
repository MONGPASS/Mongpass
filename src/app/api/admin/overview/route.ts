export const runtime = "edge";

import { forbidden, getServerContext, unauthorized } from "@/lib/auth/server";
import type { Metric, Overview } from "@/lib/admin/types";
import { hydrateShops, type ShopRow } from "@/lib/shops/dbMapper";

export async function GET(request: Request) {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();
  const daysValue = Number(new URL(request.url).searchParams.get("days") || 7);
  if (![7, 30, 90].includes(daysValue))
    return Response.json({ error: "Invalid days" }, { status: 400 });
  const days = daysValue;
  const now = new Date();
  const today = new Date(now.getTime() + 9 * 3600000)
    .toISOString()
    .slice(0, 10);
  const startDate = new Date(today + "T00:00:00+09:00");
  startDate.setUTCDate(startDate.getUTCDate() - days + 1);
  const previousDate = new Date(startDate.getTime() - days * 86400000);
  const start = startDate.toISOString().replace("T", " ").slice(0, 19);
  const previousStart = previousDate
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
  const keys: Metric[] = ["users", "shops", "orders", "posts"];
  const tables = ["users", "shops", "orders", "community_posts"];
  const aggregate = await db.batch<{
    total: number;
    current: number;
    previous: number;
  }>(
    tables.map((table) =>
      db
        .prepare(
          `SELECT COUNT(*) AS total, COALESCE(SUM(created_at >= ?),0) AS current,
       COALESCE(SUM(created_at >= ? AND created_at < ?),0) AS previous FROM ${table}`,
        )
        .bind(start, previousStart, start),
    ),
  );
  const dailyResults = await db.batch<{ date: string; count: number }>(
    tables.map((table) =>
      db
        .prepare(
          `SELECT date(created_at, '+9 hours') AS date, COUNT(*) AS count FROM ${table}
       WHERE created_at >= ? GROUP BY date(created_at, '+9 hours') ORDER BY date`,
        )
        .bind(start),
    ),
  );
  const counts = await db
    .prepare(
      `SELECT
    (SELECT COUNT(*) FROM shops WHERE status = 'pending') AS pending,
    (SELECT COUNT(*) FROM reports WHERE status = 'open') AS reports,
    (SELECT COUNT(*) FROM banners) AS banners,
    (SELECT COUNT(*) FROM shops WHERE status = 'approved' AND featured = 1) AS featured`,
    )
    .first<{
      pending: number;
      reports: number;
      banners: number;
      featured: number;
    }>();
  const categories = await db
    .prepare(
      "SELECT category, COUNT(*) AS count FROM shops WHERE status = 'approved' GROUP BY category ORDER BY count DESC",
    )
    .all<{ category: string; count: number }>();
  const pending = await db
    .prepare(
      `SELECT s.*, u.name AS owner_name, u.email AS owner_email FROM shops s
    JOIN users u ON u.id = s.owner_id WHERE s.status = 'pending' ORDER BY s.created_at ASC, s.id ASC LIMIT 5`,
    )
    .all<ShopRow & { owner_name: string; owner_email: string }>();
  const shops = await hydrateShops(db, pending.results);
  const news = await db
    .prepare(
      "SELECT id, title, created_at AS createdAt, status FROM news_articles ORDER BY created_at DESC LIMIT 3",
    )
    .all<Overview["news"][number]>();
  const totals = { ...counts } as Overview["totals"];
  const period = {} as Overview["period"];
  const previous = {} as Overview["previous"];
  keys.forEach((key, index) => {
    const row = aggregate[index].results[0];
    totals[key] = row.total;
    period[key] = row.current;
    previous[key] = row.previous;
  });
  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date(startDate.getTime() + index * 86400000 + 9 * 3600000)
      .toISOString()
      .slice(0, 10);
    const point = { date } as Overview["daily"][number];
    keys.forEach((key, metric) => {
      point[key] =
        dailyResults[metric].results.find((row) => row.date === date)?.count ??
        0;
    });
    return point;
  });
  const result: Overview = {
    generatedAt: now.toISOString(),
    days,
    totals,
    period,
    previous,
    daily,
    categories: categories.results,
    pendingShops: shops.map((shop, index) => ({
      ...shop,
      ownerName: pending.results[index].owner_name,
      ownerEmail: pending.results[index].owner_email,
    })),
    news: news.results,
  };
  return Response.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
