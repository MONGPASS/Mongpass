/**
 * Sitemap: the static surfaces plus every approved shop's detail page.
 * Shop URLs are the pages worth ranking — they carry the name/address
 * text people actually search for.
 */

export const runtime = "edge";

import type { MetadataRoute } from "next";
import { getServerContext } from "@/lib/auth/server";
import { requestOrigin } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = requestOrigin();

  const entries: MetadataRoute.Sitemap = [
    { url: `${origin}/`, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/news`, changeFrequency: "daily", priority: 0.8 },
    { url: `${origin}/community`, changeFrequency: "daily", priority: 0.7 },
    ...["meat", "restaurant", "cargo", "hospital", "beauty", "car", "travel", "other"].map(
      (slug) => ({
        url: `${origin}/category/${slug}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }),
    ),
  ];

  // Approved shops — capped well below sitemap limits; if the DB read
  // fails, ship the static entries rather than a 500.
  try {
    const { db } = await getServerContext();
    const result = await db
      .prepare(
        `SELECT id, category, created_at FROM shops
          WHERE status = 'approved'
          ORDER BY created_at DESC LIMIT 1000`,
      )
      .all<{ id: string; category: string; created_at: string }>();
    for (const row of result.results ?? []) {
      entries.push({
        url: `${origin}/category/${row.category}/${row.id}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    /* static entries only */
  }

  return entries;
}
