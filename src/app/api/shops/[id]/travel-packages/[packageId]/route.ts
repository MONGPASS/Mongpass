/**
 * /api/shops/[id]/travel-packages/[packageId]
 *   GET    — full detail (gallery + included/excluded + day list).
 *   PATCH  — partial update. Pass `images` to replace the gallery
 *            atomically; pass `days` to replace the itinerary
 *            atomically. Omit to leave them alone.
 *   DELETE — remove the package (cascades to images / days).
 */

export const runtime = "edge";

import { isResponse, requireCatalogRead, requireCatalogWrite } from "@/lib/auth/catalogGuard";
import { notFound } from "@/lib/auth/server";

interface PackageRow {
  id: string;
  shop_id: string;
  title: string;
  price: string | null;
  description: string | null;
  duration: string | null;
  group_size: string | null;
  transport: string | null;
  accommodation: string | null;
  guide: string | null;
  tour_type: string | null;
  included_json: string | null;
  excluded_json: string | null;
  status: "available" | "sold_out";
  created_at: string;
}

interface DayRow {
  id: string;
  package_id: string;
  day_number: number;
  title: string;
  description: string | null;
}

const PACKAGE_SELECT = `
  SELECT id, shop_id, title, price, description,
         duration, group_size, transport, accommodation, guide, tour_type,
         included_json, excluded_json, status, created_at
    FROM travel_packages`;

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function rowToPackage(r: PackageRow, images: string[], days: DayRow[]) {
  return {
    id: r.id,
    shopId: r.shop_id,
    title: r.title,
    price: r.price ?? undefined,
    description: r.description ?? undefined,
    duration: r.duration ?? undefined,
    groupSize: r.group_size ?? undefined,
    transport: r.transport ?? undefined,
    accommodation: r.accommodation ?? undefined,
    guide: r.guide ?? undefined,
    tourType: r.tour_type ?? undefined,
    included: parseJsonArray(r.included_json),
    excluded: parseJsonArray(r.excluded_json),
    status: r.status,
    images,
    days: days.map((d) => ({
      id: d.id,
      dayNumber: d.day_number,
      title: d.title,
      description: d.description ?? undefined,
    })),
    createdAt: r.created_at,
  };
}

async function loadFull(
  db: import("@cloudflare/workers-types").D1Database,
  shopId: string,
  packageId: string,
) {
  const row = await db
    .prepare(`${PACKAGE_SELECT} WHERE id = ? AND shop_id = ?`)
    .bind(packageId, shopId)
    .first<PackageRow>();
  if (!row) return null;
  const [imgs, days] = await Promise.all([
    db
      .prepare(
        `SELECT r2_key FROM travel_package_images
           WHERE package_id = ? ORDER BY sort_order ASC`,
      )
      .bind(packageId)
      .all<{ r2_key: string }>(),
    db
      .prepare(
        `SELECT id, package_id, day_number, title, description
           FROM travel_package_days
           WHERE package_id = ? ORDER BY day_number ASC`,
      )
      .bind(packageId)
      .all<DayRow>(),
  ]);
  return rowToPackage(
    row,
    (imgs.results ?? []).map((r) => r.r2_key),
    days.results ?? [],
  );
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string; packageId: string } },
): Promise<Response> {
  const ctx = await requireCatalogRead(params.id);
  if (isResponse(ctx)) return ctx;
  const pkg = await loadFull(ctx.db, ctx.shopId, params.packageId);
  if (!pkg) return notFound("Package not found");
  return Response.json({ package: pkg });
}

type IncomingDay = { dayNumber?: number; title?: string; description?: string };

interface IncomingPatch {
  title?: string;
  price?: string;
  description?: string;
  duration?: string;
  groupSize?: string;
  transport?: string;
  accommodation?: string;
  guide?: string;
  tourType?: string;
  included?: string[];
  excluded?: string[];
  status?: "available" | "sold_out";
  images?: string[];
  days?: IncomingDay[];
}

const PATCH_MAP: Array<[keyof IncomingPatch, string, boolean]> = [
  ["title", "title", false],
  ["price", "price", true],
  ["description", "description", true],
  ["duration", "duration", true],
  ["groupSize", "group_size", true],
  ["transport", "transport", true],
  ["accommodation", "accommodation", true],
  ["guide", "guide", true],
  ["tourType", "tour_type", true],
];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; packageId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const owns = await ctx.db
    .prepare("SELECT id FROM travel_packages WHERE id = ? AND shop_id = ?")
    .bind(params.packageId, ctx.shopId)
    .first<{ id: string }>();
  if (!owns) return notFound("Package not found");

  const body = (await request.json()) as IncomingPatch;
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [field, column, optional] of PATCH_MAP) {
    if (body[field] !== undefined) {
      const v = body[field];
      updates.push(`${column} = ?`);
      values.push(
        typeof v === "string" && v.trim()
          ? v.trim()
          : optional
          ? null
          : "",
      );
    }
  }
  if (body.included !== undefined) {
    updates.push("included_json = ?");
    values.push(
      JSON.stringify(
        body.included
          .filter((s) => typeof s === "string" && s.trim())
          .map((s) => s.trim()),
      ),
    );
  }
  if (body.excluded !== undefined) {
    updates.push("excluded_json = ?");
    values.push(
      JSON.stringify(
        body.excluded
          .filter((s) => typeof s === "string" && s.trim())
          .map((s) => s.trim()),
      ),
    );
  }
  if (body.status !== undefined) {
    if (body.status !== "available" && body.status !== "sold_out") {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.push("status = ?");
    values.push(body.status);
  }
  if (updates.length > 0) {
    values.push(params.packageId);
    await ctx.db
      .prepare(`UPDATE travel_packages SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  // Gallery + itinerary are replace-all when the corresponding array
  // is included on the body.
  if (Array.isArray(body.images)) {
    const stmts = [
      ctx.db
        .prepare("DELETE FROM travel_package_images WHERE package_id = ?")
        .bind(params.packageId),
    ];
    body.images.forEach((key, idx) => {
      if (typeof key === "string" && key.trim()) {
        stmts.push(
          ctx.db
            .prepare(
              `INSERT INTO travel_package_images (id, package_id, r2_key, sort_order)
               VALUES (?, ?, ?, ?)`,
            )
            .bind(`img-${params.packageId}-${Date.now()}-${idx}`, params.packageId, key.trim(), idx),
        );
      }
    });
    await ctx.db.batch(stmts);
  }
  if (Array.isArray(body.days)) {
    const stmts = [
      ctx.db
        .prepare("DELETE FROM travel_package_days WHERE package_id = ?")
        .bind(params.packageId),
    ];
    body.days.forEach((d, idx) => {
      if (!d.title?.trim()) return;
      stmts.push(
        ctx.db
          .prepare(
            `INSERT INTO travel_package_days
               (id, package_id, day_number, title, description, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            `day-${params.packageId}-${Date.now()}-${idx}`,
            params.packageId,
            typeof d.dayNumber === "number" ? d.dayNumber : idx + 1,
            d.title.trim(),
            d.description?.trim() || null,
            idx,
          ),
      );
    });
    await ctx.db.batch(stmts);
  }

  const pkg = await loadFull(ctx.db, ctx.shopId, params.packageId);
  if (!pkg) return notFound();
  return Response.json({ package: pkg });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; packageId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;
  const result = await ctx.db
    .prepare("DELETE FROM travel_packages WHERE id = ? AND shop_id = ?")
    .bind(params.packageId, ctx.shopId)
    .run();
  if (!result.meta.changes) return notFound("Package not found");
  return Response.json({ ok: true });
}
