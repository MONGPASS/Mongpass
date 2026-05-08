/**
 * GET /api/chat/threads/[threadId] — return one thread, hydrated with
 * shop and user names. Visible to the customer in the thread or to
 * the shop's owner.
 */

export const runtime = "edge";

import { forbidden, getServerContext, notFound, unauthorized } from "@/lib/auth/server";

interface ThreadRow {
  id: string;
  user_id: string;
  shop_id: string;
  last_message_at: string;
  last_message_preview: string | null;
}

export async function GET(
  _request: Request,
  { params }: { params: { threadId: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const row = await db
    .prepare(
      `SELECT id, user_id, shop_id, last_message_at, last_message_preview
         FROM chat_threads WHERE id = ?`,
    )
    .bind(params.threadId)
    .first<ThreadRow>();
  if (!row) return notFound("Thread not found");

  // Authorization: customer or shop owner
  let allowed = row.user_id === user.id;
  if (!allowed) {
    const shop = await db
      .prepare("SELECT owner_id FROM shops WHERE id = ?")
      .bind(row.shop_id)
      .first<{ owner_id: string }>();
    allowed = shop?.owner_id === user.id;
  }
  if (!allowed && user.role !== "admin") return forbidden();

  const [u, s] = await Promise.all([
    db.prepare("SELECT name FROM users WHERE id = ?").bind(row.user_id).first<{ name: string }>(),
    db.prepare("SELECT name FROM shops WHERE id = ?").bind(row.shop_id).first<{ name: string }>(),
  ]);

  return Response.json({
    thread: {
      id: row.id,
      userId: row.user_id,
      shopId: row.shop_id,
      userName: u?.name ?? "Хэрэглэгч",
      shopName: s?.name ?? "Дэлгүүр",
      lastMessageAt: row.last_message_at,
      lastMessagePreview: row.last_message_preview ?? "",
    },
  });
}
