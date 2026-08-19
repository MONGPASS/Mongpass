/** PATCH /api/reports/[id] { status: 'open' | 'resolved' } — admin only. */

export const runtime = "edge";

import { forbidden, getServerContext, notFound, unauthorized } from "@/lib/auth/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const body = (await request.json().catch(() => null)) as {
    status?: string;
  } | null;
  const status = body?.status;
  if (status !== "open" && status !== "resolved") {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await db
    .prepare("UPDATE reports SET status = ? WHERE id = ?")
    .bind(status, params.id)
    .run();
  if (!result.meta.changes) return notFound("Report not found");
  return Response.json({ ok: true });
}
