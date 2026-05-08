/** DELETE /api/community/posts/[postId]/comments/[commentId] — author or admin. */

export const runtime = "edge";

import {
  forbidden,
  getServerContext,
  notFound,
  unauthorized,
} from "@/lib/auth/server";

export async function DELETE(
  _request: Request,
  { params }: { params: { postId: string; commentId: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const row = await db
    .prepare(
      "SELECT author_id FROM community_comments WHERE id = ? AND post_id = ?",
    )
    .bind(params.commentId, params.postId)
    .first<{ author_id: string }>();
  if (!row) return notFound("Comment not found");
  if (row.author_id !== user.id && user.role !== "admin") return forbidden();

  await db
    .prepare("DELETE FROM community_comments WHERE id = ?")
    .bind(params.commentId)
    .run();
  return Response.json({ ok: true });
}
