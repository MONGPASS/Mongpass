/**
 * /api/push/subscribe
 *   POST   { endpoint, keys: { p256dh, auth } } — register the
 *          caller's browser push subscription (upsert; re-subscribing
 *          after a permission reset just refreshes the row).
 *   DELETE { endpoint } — unregister.
 *
 * Auth required for both: a subscription row is "send notifications
 * about this user's account to this browser".
 */

export const runtime = "edge";

import { getServerContext, unauthorized } from "@/lib/auth/server";

export async function POST(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const body = (await request.json().catch(() => null)) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  } | null;
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (
    typeof endpoint !== "string" || !endpoint.startsWith("https://") ||
    typeof p256dh !== "string" || !p256dh ||
    typeof auth !== "string" || !auth
  ) {
    return Response.json(
      { error: "endpoint and keys{p256dh,auth} are required" },
      { status: 400 },
    );
  }

  await db
    .prepare(
      `INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         user_id = excluded.user_id,
         p256dh = excluded.p256dh,
         auth = excluded.auth`,
    )
    .bind(endpoint, user.id, p256dh, auth)
    .run();

  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const body = (await request.json().catch(() => null)) as {
    endpoint?: string;
  } | null;
  if (!body?.endpoint) {
    return Response.json({ error: "endpoint required" }, { status: 400 });
  }

  // Scoped to the caller — you can only remove your own subscription.
  await db
    .prepare(
      "DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?",
    )
    .bind(body.endpoint, user.id)
    .run();

  return Response.json({ ok: true });
}
