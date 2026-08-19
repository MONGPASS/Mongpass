/**
 * DELETE /api/reviews/[id] — author or admin. Reviews previously had
 * no delete path at all: a typo (or an abusive review) was permanent
 * until an admin touched the database by hand.
 */

export const runtime = "edge";

import { forbidden, getServerContext, notFound, unauthorized } from "@/lib/auth/server";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const row = await db
    .prepare("SELECT user_id FROM reviews WHERE id = ?")
    .bind(params.id)
    .first<{ user_id: string | null }>();
  if (!row) return notFound("Review not found");
  if (row.user_id !== user.id && user.role !== "admin") return forbidden();

  await db.prepare("DELETE FROM reviews WHERE id = ?").bind(params.id).run();
  return Response.json({ ok: true });
}
