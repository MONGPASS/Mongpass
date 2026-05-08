/**
 * POST /api/community/posts/[postId]/like — toggle like for current user.
 * Returns the new like state and total count.
 */

export const runtime = "edge";

import { getServerContext, notFound, unauthorized } from "@/lib/auth/server";

export async function POST(
  _request: Request,
  { params }: { params: { postId: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const post = await db
    .prepare("SELECT id FROM community_posts WHERE id = ?")
    .bind(params.postId)
    .first<{ id: string }>();
  if (!post) return notFound("Post not found");

  const existing = await db
    .prepare("SELECT 1 FROM community_post_likes WHERE post_id = ? AND user_id = ?")
    .bind(params.postId, user.id)
    .first<unknown>();

  let liked: boolean;
  if (existing) {
    await db
      .prepare("DELETE FROM community_post_likes WHERE post_id = ? AND user_id = ?")
      .bind(params.postId, user.id)
      .run();
    liked = false;
  } else {
    await db
      .prepare(
        `INSERT INTO community_post_likes (post_id, user_id) VALUES (?, ?)`,
      )
      .bind(params.postId, user.id)
      .run();
    liked = true;
  }

  const count = await db
    .prepare("SELECT COUNT(*) as c FROM community_post_likes WHERE post_id = ?")
    .bind(params.postId)
    .first<{ c: number }>();

  return Response.json({ liked, likeCount: count?.c ?? 0 });
}
