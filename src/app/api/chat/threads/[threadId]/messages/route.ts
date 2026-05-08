/**
 * /api/chat/threads/[threadId]/messages
 *   GET  — list messages in chronological order (caller must be the
 *          customer or the shop owner of the thread)
 *   POST — { text } — send a message. The `from` side is derived
 *          from the caller's relationship to the thread, not from
 *          the body — clients can't spoof the sender.
 */

export const runtime = "edge";

import { forbidden, getServerContext, notFound, unauthorized } from "@/lib/auth/server";

interface MessageRow {
  id: string;
  thread_id: string;
  sender: "user" | "shop";
  text: string;
  created_at: string;
}

interface ThreadRow {
  id: string;
  user_id: string;
  shop_id: string;
}

async function authoriseThread(
  db: import("@cloudflare/workers-types").D1Database,
  userId: string,
  threadId: string,
): Promise<{ thread: ThreadRow; side: "user" | "shop" } | "forbidden" | "notfound"> {
  const thread = await db
    .prepare("SELECT id, user_id, shop_id FROM chat_threads WHERE id = ?")
    .bind(threadId)
    .first<ThreadRow>();
  if (!thread) return "notfound";

  if (thread.user_id === userId) {
    return { thread, side: "user" };
  }
  const shop = await db
    .prepare("SELECT owner_id FROM shops WHERE id = ?")
    .bind(thread.shop_id)
    .first<{ owner_id: string }>();
  if (shop?.owner_id === userId) {
    return { thread, side: "shop" };
  }
  return "forbidden";
}

export async function GET(
  _request: Request,
  { params }: { params: { threadId: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  const auth = await authoriseThread(db, user.id, params.threadId);
  if (auth === "forbidden") return forbidden();
  if (auth === "notfound") return notFound("Thread not found");

  // Reading the thread auto-marks it seen for the caller's side, so
  // the unread badge clears the moment the chat page mounts and polls.
  // The other side's read timestamp is left alone.
  const readColumn =
    auth.side === "user" ? "user_last_read_at" : "shop_last_read_at";
  const now = new Date().toISOString();

  const [, msgs] = await db.batch([
    db
      .prepare(
        `UPDATE chat_threads SET ${readColumn} = ? WHERE id = ?`,
      )
      .bind(now, params.threadId),
    db
      .prepare(
        `SELECT id, thread_id, sender, text, created_at
           FROM chat_messages WHERE thread_id = ?
           ORDER BY created_at ASC, rowid ASC
           LIMIT 1000`,
      )
      .bind(params.threadId),
  ]);

  return Response.json({
    messages: ((msgs.results as MessageRow[] | undefined) ?? []).map((m) => ({
      id: m.id,
      threadId: m.thread_id,
      from: m.sender,
      text: m.text,
      createdAt: m.created_at,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: { threadId: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  const auth = await authoriseThread(db, user.id, params.threadId);
  if (auth === "forbidden") return forbidden();
  if (auth === "notfound") return notFound("Thread not found");

  const body = (await request.json()) as { text?: string };
  const text = body.text?.trim();
  if (!text) {
    return Response.json({ error: "text required" }, { status: 400 });
  }
  if (text.length > 2000) {
    return Response.json({ error: "text too long" }, { status: 413 });
  }

  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  // Two writes: insert message + update thread snapshot. The sender's
  // own last-read column is bumped to `now` here so they don't see
  // their own message as "unread" when the threads list is re-fetched.
  // The other side's column is intentionally untouched — they get the
  // red badge until they open the thread.
  const readColumn =
    auth.side === "user" ? "user_last_read_at" : "shop_last_read_at";
  await db.batch([
    db
      .prepare(
        `INSERT INTO chat_messages (id, thread_id, sender, text, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(id, params.threadId, auth.side, text, now),
    db
      .prepare(
        `UPDATE chat_threads
            SET last_message_at = ?, last_message_preview = ?, ${readColumn} = ?
          WHERE id = ?`,
      )
      .bind(now, text.slice(0, 80), now, params.threadId),
  ]);

  return Response.json({
    message: {
      id,
      threadId: params.threadId,
      from: auth.side,
      text,
      createdAt: now,
    },
  }, { status: 201 });
}
