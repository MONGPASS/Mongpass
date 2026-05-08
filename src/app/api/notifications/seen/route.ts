/**
 * /api/notifications/seen
 *   GET  — return the current user's last_seen_at (ISO) or null
 *   POST — mark all notifications as seen (sets last_seen_at = now)
 *
 * The seen-state lived in localStorage in earlier phases; moving it to
 * D1 means the unread badge follows the user across devices.
 */

export const runtime = "edge";

import { getServerContext, unauthorized } from "@/lib/auth/server";

export async function GET(): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  const row = await db
    .prepare("SELECT last_seen_at FROM notifications_seen WHERE user_id = ?")
    .bind(user.id)
    .first<{ last_seen_at: string }>();
  return Response.json({ lastSeenAt: row?.last_seen_at ?? null });
}

export async function POST(): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  const now = new Date().toISOString();
  // Upsert — D1 supports ON CONFLICT.
  await db
    .prepare(
      `INSERT INTO notifications_seen (user_id, last_seen_at)
       VALUES (?, ?)
       ON CONFLICT(user_id) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
    )
    .bind(user.id, now)
    .run();
  return Response.json({ lastSeenAt: now });
}
