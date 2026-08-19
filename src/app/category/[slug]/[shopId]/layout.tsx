/**
 * Server layout whose only job is link-preview metadata for the shop
 * detail page (the page itself is a client component that fetches in
 * an effect, which scrapers never execute). Approved shops get their
 * name, description, and first photo; anything else falls back to the
 * root metadata by returning {}.
 */

export const runtime = "edge";

import type { Metadata } from "next";
import { getServerContext } from "@/lib/auth/server";
import { buildPageMetadata, toDescription } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { slug: string; shopId: string };
}): Promise<Metadata> {
  try {
    const { db } = await getServerContext();
    const shop = await db
      .prepare(
        `SELECT name, description, address, status FROM shops WHERE id = ?`,
      )
      .bind(params.shopId)
      .first<{
        name: string;
        description: string | null;
        address: string | null;
        status: string;
      }>();
    if (!shop || shop.status !== "approved") return {};

    const image = await db
      .prepare(
        `SELECT r2_key FROM shop_images WHERE shop_id = ? ORDER BY sort_order LIMIT 1`,
      )
      .bind(params.shopId)
      .first<{ r2_key: string }>();

    return buildPageMetadata({
      title: shop.name,
      description: toDescription(
        shop.description ?? shop.address,
        "MongPass дээрх дэлгүүр",
      ),
      imageR2Key: image?.r2_key,
    });
  } catch {
    // Metadata must never take the page down — fall back to defaults.
    return {};
  }
}

export default function ShopDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
