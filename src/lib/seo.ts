/**
 * Server-side metadata builders for shareable pages.
 *
 * Every customer-facing detail page is a client component that fetches
 * its data in an effect, so crawlers and link-preview scrapers (Kakao,
 * Facebook, Telegram) used to see only the generic root <title>. These
 * helpers back tiny server `layout.tsx` files whose generateMetadata
 * reads D1 directly — the page components stay untouched.
 */

import type { Metadata } from "next";
import { headers } from "next/headers";

/** Absolute origin for OG image URLs, derived from the request host. */
export function requestOrigin(): string {
  const host = headers().get("host") ?? "localhost";
  const proto = host.startsWith("localhost") || host.startsWith("127.")
    ? "http"
    : "https";
  return `${proto}://${host}`;
}

/** Trim free-form text down to a one-line description. */
export function toDescription(text: string | null | undefined, fallback: string): string {
  const cleaned = (text ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;
  return cleaned.length > 160 ? `${cleaned.slice(0, 157)}...` : cleaned;
}

export function buildPageMetadata(opts: {
  title: string;
  description: string;
  /** R2 key of the preview image, if any. */
  imageR2Key?: string | null;
}): Metadata {
  const images = opts.imageR2Key
    ? [{ url: `${requestOrigin()}/api/r2/${opts.imageR2Key}` }]
    : undefined;
  return {
    title: `${opts.title} | MongPass`,
    description: opts.description,
    openGraph: {
      title: opts.title,
      description: opts.description,
      siteName: "MongPass",
      type: "website",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: opts.title,
      description: opts.description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}
