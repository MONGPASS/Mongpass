/**
 * POST /api/users/[id]/ban { banned: boolean, reason? } — admin only.
 *
 * Banning also deletes the user's sessions immediately; the session
 * validator would catch the flag on their next request anyway, but a
 * live abuser shouldn't get "one more request" of grace.
 *
 * Admins can't be banned through the API — demote them first (via
 * ADMIN_EMAILS + DB) if it ever comes to that. Prevents a compromised
 * admin account from locking out the others.
 */

export const runtime = "edge";

import { forbidden, getServerContext, notFound, unauthorized } from "@/lib/auth/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const body = (await request.json().catch(() => null)) as {
    banned?: boolean;
    reason?: string;
  } | null;
  if (typeof body?.banned !== "boolean") {
    return Response.json({ error: "banned (boolean) required" }, { status: 400 });
  }

  const target = await db
    .prepare("SELECT id, role FROM users WHERE id = ?")
    .bind(params.id)
    .first<{ id: string; role: string }>();
  if (!target) return notFound("User not found");
  if (target.role === "admin") {
    return Response.json({ error: "Cannot ban an admin" }, { status: 409 });
  }

  if (body.banned) {
    await db.batch([
      db
        .prepare(
          `UPDATE users
              SET banned = 1,
                  banned_reason = ?,
                  banned_at = datetime('now')
            WHERE id = ?`,
        )
        .bind(body.reason?.trim() || null, params.id),
      db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(params.id),
    ]);
  } else {
    await db
      .prepare(
        `UPDATE users
            SET banned = 0, banned_reason = NULL, banned_at = NULL
          WHERE id = ?`,
      )
      .bind(params.id)
      .run();
  }

  return Response.json({ ok: true, banned: body.banned });
}
