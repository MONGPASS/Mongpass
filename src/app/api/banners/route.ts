/**
 * /api/banners
 *   GET — public list, ordered by sort_order ASC.
 *   PUT — admin-only full replace. The body is the new banner list in
 *         display order; the server reassigns sort_order from the
 *         array index so reorder UI doesn't have to maintain it
 *         explicitly. Wrapped in a D1 batch so a partial failure
 *         never leaves the table half-written.
 *
 * The admin page treats banners as a small array (~5–10 items) and
 * always re-saves the entire list on any change, so a delete-all-
 * insert-all pattern is fine here. We'd revisit if the count grew.
 */

export const runtime = "edge";

import { forbidden, getServerContext, unauthorized } from "@/lib/auth/server";
import type { BannerGradient } from "@/lib/bannerStore";

const VALID_GRADIENTS: BannerGradient[] = [
  "blue",
  "purple",
  "orange",
  "emerald",
  "pink",
  "slate",
];

interface BannerRow {
  id: string;
  badge: string;
  title: string;
  description: string | null;
  gradient: string;
  sort_order: number;
  image_r2_key: string | null;
}

function rowToBanner(r: BannerRow) {
  return {
    id: r.id,
    badge: r.badge,
    title: r.title,
    desc: r.description ?? "",
    gradient: r.gradient as BannerGradient,
    // Stored as an R2 key; if non-null, served via /api/r2/<key> by
    // r2Url() at the call site. Falls through to the gradient when null.
    imageR2Key: r.image_r2_key ?? undefined,
  };
}

export async function GET(): Promise<Response> {
  const { db } = await getServerContext();
  const result = await db
    .prepare(
      `SELECT id, badge, title, description, gradient, sort_order, image_r2_key
         FROM banners ORDER BY sort_order ASC, id ASC LIMIT 50`,
    )
    .all<BannerRow>();
  return Response.json({ banners: (result.results ?? []).map(rowToBanner) });
}

export async function PUT(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const body = (await request.json().catch(() => ({}))) as {
    banners?: Array<{
      id?: string;
      badge?: string;
      title?: string;
      desc?: string;
      gradient?: string;
      imageR2Key?: string | null;
    }>;
  };
  const incoming = body.banners ?? [];

  // Validate up front so we don't half-write on a bad payload.
  for (const b of incoming) {
    if (!b.badge?.trim() || !b.title?.trim()) {
      return Response.json(
        { error: "badge and title are required for every banner" },
        { status: 400 },
      );
    }
    if (b.gradient && !VALID_GRADIENTS.includes(b.gradient as BannerGradient)) {
      return Response.json(
        { error: `invalid gradient "${b.gradient}"` },
        { status: 400 },
      );
    }
  }

  // Replace the entire list in one batch so an error mid-way doesn't
  // leave a stale subset visible on the home page.
  const stmts = [db.prepare("DELETE FROM banners")];
  incoming.forEach((b, idx) => {
    const id = b.id ?? `banner-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
    stmts.push(
      db
        .prepare(
          `INSERT INTO banners
             (id, badge, title, description, gradient, sort_order, image_r2_key)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          b.badge!.trim(),
          b.title!.trim(),
          b.desc?.trim() || null,
          b.gradient ?? "blue",
          idx,
          typeof b.imageR2Key === "string" && b.imageR2Key.trim()
            ? b.imageR2Key.trim()
            : null,
        ),
    );
  });
  await db.batch(stmts);

  // Return the freshly persisted list so the client can sync IDs (the
  // server may have minted new ones for added entries).
  const result = await db
    .prepare(
      `SELECT id, badge, title, description, gradient, sort_order, image_r2_key
         FROM banners ORDER BY sort_order ASC, id ASC LIMIT 50`,
    )
    .all<BannerRow>();
  return Response.json({ banners: (result.results ?? []).map(rowToBanner) });
}
