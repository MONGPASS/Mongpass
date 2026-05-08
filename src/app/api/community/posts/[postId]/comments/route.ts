/**
 * /api/community/posts/[postId]/comments
 *   GET  — list comments (oldest first), public
 *   POST — { content } — auth required
 */

export const runtime = "edge";

import { getServerContext, notFound, unauthorized } from "@/lib/auth/server";

interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name: string;
}

function rowToComment(r: CommentRow) {
  return {
    id: r.id,
    postId: r.post_id,
    authorId: r.author_id,
    authorName: r.author_name,
    content: r.content,
    createdAt: r.created_at,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { postId: string } },
): Promise<Response> {
  const { db } = await getServerContext();
  const result = await db
    .prepare(
      `SELECT c.id, c.post_id, c.author_id, c.content, c.created_at,
              u.name AS author_name
         FROM community_comments c
         LEFT JOIN users u ON u.id = c.author_id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC, c.rowid ASC`,
    )
    .bind(params.postId)
    .all<CommentRow>();
  return Response.json({ comments: (result.results ?? []).map(rowToComment) });
}

export async function POST(
  request: Request,
  { params }: { params: { postId: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const post = await db
    .prepare("SELECT id FROM community_posts WHERE id = ?")
    .bind(params.postId)
    .first<{ id: string }>();
  if (!post) return notFound("Post not found");

  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim();
  if (!content) {
    return Response.json({ error: "content required" }, { status: 400 });
  }

  const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await db
    .prepare(
      `INSERT INTO community_comments (id, post_id, author_id, content)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, params.postId, user.id, content)
    .run();
  const row = await db
    .prepare(
      `SELECT c.id, c.post_id, c.author_id, c.content, c.created_at,
              u.name AS author_name
         FROM community_comments c
         LEFT JOIN users u ON u.id = c.author_id
        WHERE c.id = ?`,
    )
    .bind(id)
    .first<CommentRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  return Response.json({ comment: rowToComment(row) }, { status: 201 });
}
