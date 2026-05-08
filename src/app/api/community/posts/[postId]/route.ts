/**
 * /api/community/posts/[postId]
 *   GET    — public, with like_count / comment_count and the caller's
 *            "did I like" flag if authenticated
 *   DELETE — author or admin
 */

export const runtime = "edge";

import {
  forbidden,
  getServerContext,
  notFound,
  unauthorized,
} from "@/lib/auth/server";

interface PostRow {
  id: string;
  author_id: string;
  category: string;
  title: string;
  content: string;
  image_r2_key: string | null;
  created_at: string;
  author_name: string;
  like_count: number;
  comment_count: number;
}

function rowToPost(r: PostRow, likes: string[]) {
  return {
    id: r.id,
    authorId: r.author_id,
    authorName: r.author_name,
    category: r.category,
    title: r.title,
    content: r.content,
    imageDataUrl: r.image_r2_key ?? undefined,
    likes,
    likeCount: r.like_count,
    commentCount: r.comment_count,
    createdAt: r.created_at,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { postId: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  const row = await db
    .prepare(
      `SELECT p.id, p.author_id, p.category, p.title, p.content,
              p.image_r2_key, p.created_at,
              u.name AS author_name,
              (SELECT COUNT(*) FROM community_post_likes l WHERE l.post_id = p.id) AS like_count,
              (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id) AS comment_count
         FROM community_posts p
         LEFT JOIN users u ON u.id = p.author_id
        WHERE p.id = ?`,
    )
    .bind(params.postId)
    .first<PostRow>();
  if (!row) return notFound("Post not found");

  // Echo just the caller's like state to keep payloads small.
  const likes: string[] = [];
  if (user) {
    const liked = await db
      .prepare("SELECT 1 FROM community_post_likes WHERE post_id = ? AND user_id = ?")
      .bind(params.postId, user.id)
      .first<{ "1": number } | null>();
    if (liked) likes.push(user.id);
  }

  return Response.json({ post: rowToPost(row, likes) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { postId: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const row = await db
    .prepare("SELECT author_id FROM community_posts WHERE id = ?")
    .bind(params.postId)
    .first<{ author_id: string }>();
  if (!row) return notFound("Post not found");
  if (row.author_id !== user.id && user.role !== "admin") return forbidden();

  // Cascade is set on FK in the schema, so likes + comments go too.
  await db
    .prepare("DELETE FROM community_posts WHERE id = ?")
    .bind(params.postId)
    .run();
  return Response.json({ ok: true });
}
