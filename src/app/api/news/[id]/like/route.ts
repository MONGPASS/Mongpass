/**
 * /api/news/[id]/like
 *   POST — toggle the caller's heart on this article. Returns the
 *          fresh state and total count so the client can update its
 *          local UI without a re-fetch.
 *
 * Composite-PK insert/delete handles idempotency for free.
 */

export const runtime = "edge";

import { getServerContext, notFound, unauthorized } from "@/lib/auth/server";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const article = await db
    .prepare("SELECT id FROM news_articles WHERE id = ?")
    .bind(params.id)
    .first<{ id: string }>();
  if (!article) return notFound("Article not found");

  // Is the caller's like already there?
  const existing = await db
    .prepare(
      "SELECT 1 FROM news_article_likes WHERE article_id = ? AND user_id = ? LIMIT 1",
    )
    .bind(params.id, user.id)
    .first<{ "1": number }>();

  if (existing) {
    await db
      .prepare(
        "DELETE FROM news_article_likes WHERE article_id = ? AND user_id = ?",
      )
      .bind(params.id, user.id)
      .run();
  } else {
    await db
      .prepare(
        `INSERT OR IGNORE INTO news_article_likes (article_id, user_id) VALUES (?, ?)`,
      )
      .bind(params.id, user.id)
      .run();
  }

  const count = await db
    .prepare(
      "SELECT COUNT(*) AS n FROM news_article_likes WHERE article_id = ?",
    )
    .bind(params.id)
    .first<{ n: number }>();

  return Response.json({
    liked: !existing,
    likeCount: count?.n ?? 0,
  });
}
