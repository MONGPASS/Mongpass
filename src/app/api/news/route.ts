/**
 * /api/news
 *   GET  ?status=published|all — list articles. `all` requires admin.
 *                                Default is published-only (public).
 *   POST { title, content, coverR2Key?, tags?, status? } — admin only.
 *
 * Each article in the GET response includes its like count and a
 * `liked` flag for the caller (false when signed out).
 */

export const runtime = "edge";

import { forbidden, getServerContext, unauthorized } from "@/lib/auth/server";

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

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const { db, user } = await getServerContext();

  const isAdmin = user?.role === "admin";
  // Only admins can see drafts. Non-admin requesting `all` gets a 403.
  if (status === "all") {
    if (!isAdmin) return forbidden();
  }

  const where = status === "all" ? "" : "WHERE status = 'published'";
  const rows = await db
    .prepare(`${ARTICLE_SELECT} ${where} ORDER BY created_at DESC LIMIT 200`)
    .all<ArticleRow>();
  const articles = rows.results ?? [];
  if (articles.length === 0) return Response.json({ articles: [] });

  const ids = articles.map((a) => a.id);
  const placeholders = ids.map(() => "?").join(",");

  // One query to count likes per article, and (if signed in) one to
  // figure out which ones the caller has already hearted. Two batched
  // queries beats N+1 by a wide margin even for small lists.
  const [counts, myLikes] = await Promise.all([
    db
      .prepare(
        `SELECT article_id, COUNT(*) AS n FROM news_article_likes
           WHERE article_id IN (${placeholders})
           GROUP BY article_id`,
      )
      .bind(...ids)
      .all<{ article_id: string; n: number }>(),
    user
      ? db
          .prepare(
            `SELECT article_id FROM news_article_likes
               WHERE article_id IN (${placeholders}) AND user_id = ?`,
          )
          .bind(...ids, user.id)
          .all<{ article_id: string }>()
      : Promise.resolve({ results: [] as Array<{ article_id: string }> }),
  ]);

  const countByArticle = new Map<string, number>();
  for (const r of counts.results ?? []) {
    countByArticle.set(r.article_id, r.n);
  }
  const likedByArticle = new Set<string>(
    (myLikes.results ?? []).map((r) => r.article_id),
  );

  return Response.json({
    articles: articles.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      coverR2Key: r.cover_r2_key ?? undefined,
      tags: parseTags(r.tags_json),
      status: r.status,
      likeCount: countByArticle.get(r.id) ?? 0,
      liked: likedByArticle.has(r.id),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
}

export async function POST(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const body = (await request.json()) as Partial<{
    title: string;
    content: string;
    coverR2Key: string | null;
    tags: string[];
    status: "draft" | "published";
  }>;
  if (!body.title?.trim() || !body.content?.trim()) {
    return Response.json(
      { error: "title and content are required" },
      { status: 400 },
    );
  }

  const id = `news-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tags = Array.isArray(body.tags)
    ? body.tags
        .filter((s) => typeof s === "string" && s.trim())
        .map((s) => s.trim())
    : [];
  const status = body.status === "draft" ? "draft" : "published";
  const coverKey =
    typeof body.coverR2Key === "string" && body.coverR2Key.trim()
      ? body.coverR2Key.trim()
      : null;

  await db
    .prepare(
      `INSERT INTO news_articles
         (id, title, content, cover_r2_key, tags_json, status, author_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      body.title.trim(),
      body.content.trim(),
      coverKey,
      JSON.stringify(tags),
      status,
      user.id,
    )
    .run();

  const row = await db
    .prepare(`${ARTICLE_SELECT} WHERE id = ?`)
    .bind(id)
    .first<ArticleRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  return Response.json(
    {
      article: {
        id: row.id,
        title: row.title,
        content: row.content,
        coverR2Key: row.cover_r2_key ?? undefined,
        tags: parseTags(row.tags_json),
        status: row.status,
        likeCount: 0,
        liked: false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    },
    { status: 201 },
  );
}
