/**
 * Crawler policy. Everything public is crawlable; owner/admin surfaces
 * and the API are pointless (or private) for a crawler, so keep them
 * out of the index.
 */

export const runtime = "edge";

import type { MetadataRoute } from "next";
import { requestOrigin } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/biz", "/profile", "/chat", "/notifications"],
    },
    sitemap: `${requestOrigin()}/sitemap.xml`,
  };
}
