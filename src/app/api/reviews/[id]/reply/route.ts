/**
 * /api/reviews/[id]/reply — the shop's public answer to a review.
 *   POST   { reply } — set/update (shop owner of the reviewed shop,
 *                      or admin)
 *   DELETE           — clear it (same authorisation)
 *
 * A bad review with a calm owner reply builds more trust than a
 * perfect score; until now owners had no way to answer at all.
 */

export const runtime = "edge";

import { forbidden, getServerContext, notFound, unauthorized } from "@/lib/auth/server";

const MAX_REPLY = 1000;

async function authorise(
  db: import("@cloudflare/workers-types").D1Database,
  userId: string,
  role: string,
  reviewId: string,
): Promise<"ok" | "forbidden" | "notfound"> {
  const row = await db
    .prepare(
      `SELECT s.owner_id
         FROM reviews r
         JOIN shops s ON s.id = r.shop_id
        WHERE r.id = ?`,
    )
    .bind(reviewId)
    .first<{ owner_id: string }>();
  if (!row) return "notfound";
  if (row.owner_id !== userId && role !== "admin") return "forbidden";
  return "ok";
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  const auth = await authorise(db, user.id, user.role, params.id);
  if (auth === "notfound") return notFound("Review not found");
  if (auth === "forbidden") return forbidden();

  const body = (await request.json().catch(() => null)) as {
    reply?: string;
  } | null;
  const reply = body?.reply?.trim();
  if (!reply) {
    return Response.json({ error: "reply is required" }, { status: 400 });
  }

  await db
    .prepare(
      `UPDATE reviews SET reply = ?, reply_at = datetime('now') WHERE id = ?`,
    )
    .bind(reply.slice(0, MAX_REPLY), params.id)
    .run();
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  const auth = await authorise(db, user.id, user.role, params.id);
  if (auth === "notfound") return notFound("Review not found");
  if (auth === "forbidden") return forbidden();

  await db
    .prepare("UPDATE reviews SET reply = NULL, reply_at = NULL WHERE id = ?")
    .bind(params.id)
    .run();
  return Response.json({ ok: true });
}
