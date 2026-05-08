/**
 * /api/chat/threads
 *   GET  ?role=user|shop — list the caller's threads
 *                         user (default): threads where they are the customer
 *                         shop:           threads to any shop they own
 *   POST { shopId, userName?, shopName? }
 *     Idempotent get-or-create. Returns the thread for (current user,
 *     given shop). User must be authenticated; shop must exist.
 *     Snapshots names from current state if not supplied.
 */

export const runtime = "edge";

import { getServerContext, notFound, unauthorized } from "@/lib/auth/server";

interface ThreadRow {
  id: string;
  user_id: string;
  shop_id: string;
  last_message_at: string;
  last_message_preview: string | null;
  user_last_read_at: string | null;
  shop_last_read_at: string | null;
}

interface ThreadView {
  id: string;
  userId: string;
  shopId: string;
  shopName: string;
  userName: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unread: boolean;
}

async function rowsToThreads(
  db: import("@cloudflare/workers-types").D1Database,
  rows: ThreadRow[],
  side: "user" | "shop",
): Promise<ThreadView[]> {
  if (rows.length === 0) return [];
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const shopIds = Array.from(new Set(rows.map((r) => r.shop_id)));
  const userPlace = userIds.map(() => "?").join(",");
  const shopPlace = shopIds.map(() => "?").join(",");
  const [users, shops] = await Promise.all([
    db
      .prepare(`SELECT id, name FROM users WHERE id IN (${userPlace})`)
      .bind(...userIds)
      .all<{ id: string; name: string }>(),
    db
      .prepare(`SELECT id, name FROM shops WHERE id IN (${shopPlace})`)
      .bind(...shopIds)
      .all<{ id: string; name: string }>(),
  ]);
  const userName = new Map((users.results ?? []).map((u) => [u.id, u.name]));
  const shopName = new Map((shops.results ?? []).map((s) => [s.id, s.name]));
  return rows.map((r) => {
    const myLastRead =
      side === "user" ? r.user_last_read_at : r.shop_last_read_at;
    const unread = !myLastRead || r.last_message_at > myLastRead;
    return {
      id: r.id,
      userId: r.user_id,
      shopId: r.shop_id,
      userName: userName.get(r.user_id) ?? "Хэрэглэгч",
      shopName: shopName.get(r.shop_id) ?? "Дэлгүүр",
      lastMessageAt: r.last_message_at,
      lastMessagePreview: r.last_message_preview ?? "",
      unread,
    };
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const role = url.searchParams.get("role") ?? "user";

  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  let result;
  if (role === "shop") {
    // Threads addressed to any shop the caller owns
    result = await db
      .prepare(
        `SELECT t.id, t.user_id, t.shop_id, t.last_message_at,
                t.last_message_preview, t.user_last_read_at, t.shop_last_read_at
           FROM chat_threads t
           JOIN shops s ON s.id = t.shop_id
          WHERE s.owner_id = ?
          ORDER BY t.last_message_at DESC
          LIMIT 200`,
      )
      .bind(user.id)
      .all<ThreadRow>();
  } else {
    result = await db
      .prepare(
        `SELECT id, user_id, shop_id, last_message_at, last_message_preview,
                user_last_read_at, shop_last_read_at
           FROM chat_threads
          WHERE user_id = ?
          ORDER BY last_message_at DESC
          LIMIT 200`,
      )
      .bind(user.id)
      .all<ThreadRow>();
  }

  const side: "user" | "shop" = role === "shop" ? "shop" : "user";
  const threads = await rowsToThreads(db, result.results ?? [], side);
  return Response.json({ threads });
}

export async function POST(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const body = (await request.json()) as { shopId?: string };
  if (!body.shopId) {
    return Response.json({ error: "shopId required" }, { status: 400 });
  }

  const shop = await db
    .prepare("SELECT id, name FROM shops WHERE id = ?")
    .bind(body.shopId)
    .first<{ id: string; name: string }>();
  if (!shop) return notFound("Shop not found");

  const id = `${user.id}:${shop.id}`;
  const existing = await db
    .prepare(
      `SELECT id, user_id, shop_id, last_message_at, last_message_preview,
              user_last_read_at, shop_last_read_at
         FROM chat_threads WHERE id = ?`,
    )
    .bind(id)
    .first<ThreadRow>();

  if (!existing) {
    await db
      .prepare(
        `INSERT INTO chat_threads (id, user_id, shop_id, last_message_preview)
         VALUES (?, ?, ?, NULL)`,
      )
      .bind(id, user.id, shop.id)
      .run();
  }

  const row = await db
    .prepare(
      `SELECT id, user_id, shop_id, last_message_at, last_message_preview,
              user_last_read_at, shop_last_read_at
         FROM chat_threads WHERE id = ?`,
    )
    .bind(id)
    .first<ThreadRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });

  // Caller of POST is the customer side (user owns the thread).
  const [thread] = await rowsToThreads(db, [row], "user");
  return Response.json({ thread }, { status: 201 });
}
