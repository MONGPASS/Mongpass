/**
 * /api/chat/unread
 *   GET — total chat threads with unread activity for the current user
 *         (sums both their customer-side threads and any threads that
 *         target shops they own). Used to drive the red badge on the
 *         Чат tab in BottomNav.
 *
 * "Unread" = the thread's last_message_at is newer than the caller's
 * last-read timestamp on that side, OR they've never opened it but a
 * message exists.
 *
 * Returns 0 for unauthenticated callers (rather than 401) so BottomNav
 * doesn't have to special-case the signed-out state.
 */

export const runtime = "edge";

import { getServerContext } from "@/lib/auth/server";

export async function GET(): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return Response.json({ count: 0 });

  // A thread counts as unread when the caller's last_read column is
  // either null AND there's been at least one message (last_message_at
  // is set on insert via DEFAULT), or strictly older than the most
  // recent message timestamp.
  //
  // We need to count both sides — a single user can be both a
  // customer (in their own threads) and a shop owner (threads against
  // shops they own). UNION ALL works because the two sets never
  // overlap (a user can't be both customer and shop on the same
  // thread).
  const result = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM (
         SELECT 1
           FROM chat_threads
          WHERE user_id = ?1
            AND (user_last_read_at IS NULL OR last_message_at > user_last_read_at)
            AND last_message_preview IS NOT NULL
         UNION ALL
         SELECT 1
           FROM chat_threads t
           JOIN shops s ON s.id = t.shop_id
          WHERE s.owner_id = ?1
            AND (t.shop_last_read_at IS NULL OR t.last_message_at > t.shop_last_read_at)
            AND t.last_message_preview IS NOT NULL
       )`,
    )
    .bind(user.id)
    .first<{ n: number }>();

  return Response.json({ count: result?.n ?? 0 });
}
