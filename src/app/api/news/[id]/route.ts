/**
 * /api/news/[id]
 *   GET    — public detail (404 for drafts unless the caller is admin)
 *   PATCH  — admin-only. Partial; pass `coverR2Key=null` to clear.
 *   DELETE — admin-only.
 */

export const runtime = "edge";

import { forbidden, getServerContext, notFound, unauthorized } from "@/lib/auth/server";

interface ArticleRow {
  id: string;
  title: string;
  content: string;
  cover_r2_key: string | null;
  tags_json: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

const ARTICLE_SELECT = `
  SELECT id, title, content, cover_r2_key, tags_json, status,
         created_at, updated_at
    FROM news_articles`;

async function loadWithLikes(
  db: import("@cloudflare/workers-types").D1Database,
  id: string,
  callerId: string | null,
) {
  const row = await db
    .prepare(`${ARTICLE_SELECT} WHERE id = ?`)
    .bind(id)
    .first<ArticleRow>();
  if (!row) return null;
  const [count, mine] = await Promise.all([
    db
      .prepare("SELECT COUNT(*) AS n FROM news_article_likes WHERE article_id = ?")
      .bind(id)
      .first<{ n: number }>(),
    callerId
      ? db
          .prepare(
            "SELECT 1 FROM news_article_likes WHERE article_id = ? AND user_id = ? LIMIT 1",
          )
          .bind(id, callerId)
          .first<{ "1": number }>()
      : Promise.resolve(null),
  ]);
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    coverR2Key: row.cover_r2_key ?? undefined,
    tags: parseTags(row.tags_json),
    status: row.status,
    likeCount: count?.n ?? 0,
    liked: !!mine,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  const article = await loadWithLikes(db, params.id, user?.id ?? null);
  if (!article) return notFound("Article not found");
  // Drafts are admin-only.
  if (article.status === "draft" && user?.role !== "admin") {
    return notFound("Article not found");
  }
  return Response.json({ article });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const existing = await db
    .prepare("SELECT id FROM news_articles WHERE id = ?")
    .bind(params.id)
    .first<{ id: string }>();
  if (!existing) return notFound("Article not found");

  const body = (await request.json()) as Partial<{
    title: string;
    content: string;
    coverR2Key: string | null;
    tags: string[];
    status: "draft" | "published";
  }>;

  const updates: string[] = [];
  const values: unknown[] = [];
  if (body.title !== undefined) {
    if (!body.title.trim()) {
      return Response.json({ error: "title cannot be empty" }, { status: 400 });
    }
    updates.push("title = ?");
    values.push(body.title.trim());
  }
  if (body.content !== undefined) {
    if (!body.content.trim()) {
      return Response.json({ error: "content cannot be empty" }, { status: 400 });
    }
    updates.push("content = ?");
    values.push(body.content.trim());
  }
  if (body.coverR2Key !== undefined) {
    updates.push("cover_r2_key = ?");
    values.push(
      typeof body.coverR2Key === "string" && body.coverR2Key.trim()
        ? body.coverR2Key.trim()
        : null,
    );
  }
  if (body.tags !== undefined) {
    const tags = Array.isArray(body.tags)
      ? body.tags
          .filter((s) => typeof s === "string" && s.trim())
          .map((s) => s.trim())
      : [];
    updates.push("tags_json = ?");
    values.push(JSON.stringify(tags));
  }
  if (body.status !== undefined) {
    if (body.status !== "draft" && body.status !== "published") {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.push("status = ?");
    values.push(body.status);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(params.id);
    await db
      .prepare(`UPDATE news_articles SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  const article = await loadWithLikes(db, params.id, user.id);
  if (!article) return notFound();
  return Response.json({ article });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();
  const result = await db
    .prepare("DELETE FROM news_articles WHERE id = ?")
    .bind(params.id)
    .run();
  if (!result.meta.changes) return notFound("Article not found");
  return Response.json({ ok: true });
}
