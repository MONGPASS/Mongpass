/**
 * /api/community/posts
 *   GET  ?category=… — list posts (public, newest first)
 *   POST { category, title, content, imageDataUrl? } — auth required
 */

export const runtime = "edge";

import { getServerContext, unauthorized } from "@/lib/auth/server";

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

function rowToPost(r: PostRow, likedBy: string[] = []) {
  return {
    id: r.id,
    authorId: r.author_id,
    authorName: r.author_name,
    category: r.category,
    title: r.title,
    content: r.content,
    imageDataUrl: r.image_r2_key ?? undefined,
    likes: likedBy,
    likeCount: r.like_count,
    commentCount: r.comment_count,
    createdAt: r.created_at,
  };
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const { db } = await getServerContext();

  const conditions: string[] = [];
  const values: unknown[] = [];
  if (category) {
    conditions.push("p.category = ?");
    values.push(category);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // JOIN users for author name; subqueries for like + comment counts
  const result = await db
    .prepare(
      `SELECT p.id, p.author_id, p.category, p.title, p.content,
              p.image_r2_key, p.created_at,
              u.name AS author_name,
              (SELECT COUNT(*) FROM community_post_likes l WHERE l.post_id = p.id) AS like_count,
              (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id) AS comment_count
         FROM community_posts p
         LEFT JOIN users u ON u.id = p.author_id
         ${where}
         ORDER BY p.created_at DESC
         LIMIT 100`,
    )
    .bind(...values)
    .all<PostRow>();

  return Response.json({ posts: (result.results ?? []).map((r) => rowToPost(r)) });
}

export async function POST(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const body = (await request.json()) as Partial<{
    category: string;
    title: string;
    content: string;
    imageDataUrl: string;
  }>;

  if (!body.category?.trim() || !body.title?.trim() || !body.content?.trim()) {
    return Response.json(
      { error: "category, title, content are required" },
      { status: 400 },
    );
  }

  // imageDataUrl might be a full /api/r2/<key> url; strip the prefix
  // and store just the R2 key for consistency with other tables.
  let imageKey: string | null = null;
  if (body.imageDataUrl) {
    const trimmed = body.imageDataUrl.startsWith("/api/r2/")
      ? body.imageDataUrl.slice("/api/r2/".length)
      : body.imageDataUrl;
    imageKey = trimmed || null;
  }

  const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await db
    .prepare(
      `INSERT INTO community_posts (id, author_id, category, title, content, image_r2_key)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, user.id, body.category.trim(), body.title.trim(), body.content.trim(), imageKey)
    .run();

  const row = await db
    .prepare(
      `SELECT p.id, p.author_id, p.category, p.title, p.content,
              p.image_r2_key, p.created_at,
              u.name AS author_name,
              0 AS like_count,
              0 AS comment_count
         FROM community_posts p
         LEFT JOIN users u ON u.id = p.author_id
        WHERE p.id = ?`,
    )
    .bind(id)
    .first<PostRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  return Response.json({ post: rowToPost(row) }, { status: 201 });
}
