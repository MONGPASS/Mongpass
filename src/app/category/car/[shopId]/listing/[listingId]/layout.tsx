/**
 * Link-preview metadata for used-car listings — the single most-shared
 * content type (Facebook groups are where these ads circulate). Same
 * pattern as the shop-detail layout: server layout + D1 read, client
 * page untouched.
 */

export const runtime = "edge";

import type { Metadata } from "next";
import { getServerContext } from "@/lib/auth/server";
import { buildPageMetadata, toDescription } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { shopId: string; listingId: string };
}): Promise<Metadata> {
  try {
    const { db } = await getServerContext();
    const listing = await db
      .prepare(
        `SELECT l.title, l.price, l.description, s.status AS shop_status
           FROM car_listings l
           JOIN shops s ON s.id = l.shop_id
          WHERE l.id = ? AND l.shop_id = ?`,
      )
      .bind(params.listingId, params.shopId)
      .first<{
        title: string;
        price: string | null;
        description: string | null;
        shop_status: string;
      }>();
    if (!listing || listing.shop_status !== "approved") return {};

    const image = await db
      .prepare(
        `SELECT r2_key FROM car_listing_images
          WHERE listing_id = ? ORDER BY sort_order LIMIT 1`,
      )
      .bind(params.listingId)
      .first<{ r2_key: string }>();

    const title = listing.price
      ? `${listing.title} — ${listing.price}`
      : listing.title;
    return buildPageMetadata({
      title,
      description: toDescription(listing.description, "MongPass дээрх машины зар"),
      imageR2Key: image?.r2_key,
    });
  } catch {
    return {};
  }
}

export default function CarListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
