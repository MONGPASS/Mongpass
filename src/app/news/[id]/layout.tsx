/**
 * Link-preview metadata for editorial news articles — published-only,
 * mirroring the /api/news visibility rule.
 */

export const runtime = "edge";

import type { Metadata } from "next";
import { getServerContext } from "@/lib/auth/server";
import { buildPageMetadata, toDescription } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const { db } = await getServerContext();
    const article = await db
      .prepare(
        `SELECT title, content, cover_r2_key, status FROM news_articles WHERE id = ?`,
      )
      .bind(params.id)
      .first<{
        title: string;
        content: string;
        cover_r2_key: string | null;
        status: string;
      }>();
    if (!article || article.status !== "published") return {};

    return buildPageMetadata({
      title: article.title,
      description: toDescription(article.content, "MongPass мэдээ"),
      imageR2Key: article.cover_r2_key,
    });
  } catch {
    return {};
  }
}

export default function NewsArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
