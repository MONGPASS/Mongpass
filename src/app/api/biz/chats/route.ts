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
  const page = Math.max(
    1,
    Math.min(100000, Math.floor(Number(params.get("page")) || 1)),
  );
  const limit = clampLimit(params.get("limit"), 20, 50);
  const where = ["t.shop_id = ?"];
  const values = [shop.id];
  const q = params.get("q")?.trim().slice(0, 200);
  if (q) {
    where.push("(u.name LIKE ? OR t.last_message_preview LIKE ?)");
    values.push(`%${q}%`, `%${q}%`);
  }
  if (params.get("unread") === "true")
    where.push(
      "t.last_message_preview IS NOT NULL AND (t.shop_last_read_at IS NULL OR t.last_message_at > t.shop_last_read_at)",
    );
  const base = `FROM chat_threads t JOIN users u ON u.id = t.user_id WHERE ${where.join(" AND ")}`;
  const total = await db
    .prepare(`SELECT COUNT(*) AS count ${base}`)
    .bind(...values)
    .first<{ count: number }>();
  const threads = await db
    .prepare(
      `SELECT t.id, t.shop_id AS shopId, t.user_id AS userId, u.name AS userName,
    t.last_message_at AS lastMessageAt, t.last_message_preview AS lastMessagePreview,
    (t.last_message_preview IS NOT NULL AND (t.shop_last_read_at IS NULL OR t.last_message_at > t.shop_last_read_at)) AS unread
    ${base} ORDER BY t.last_message_at DESC, t.id DESC LIMIT ? OFFSET ?`,
    )
    .bind(...values, limit, (page - 1) * limit)
    .all();
  return Response.json(
    {
      threads: threads.results.map((thread) => ({
        ...thread,
        shopName: shop.name,
        unread: Boolean(thread.unread),
      })),
      page,
      limit,
      total: total?.count ?? 0,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
