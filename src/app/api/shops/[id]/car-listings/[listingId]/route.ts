/**
 * /api/shops/[id]/car-listings/[listingId]
 *   GET    — public detail view (any user, used by the customer-facing
 *            listing detail page)
 *   PATCH  — partial update (owner / admin). Pass `images` to replace
 *            the gallery; omit it to leave photos alone.
 *   DELETE — remove the listing (owner / admin). The image rows go
 *            via ON DELETE CASCADE.
 */

export const runtime = "edge";

import { isResponse, requireCatalogRead, requireCatalogWrite } from "@/lib/auth/catalogGuard";
import { notFound } from "@/lib/auth/server";

interface ListingRow {
  id: string;
  shop_id: string;
  title: string;
  brand: string | null;
  model: string | null;
  price: string | null;
  description: string | null;
  location: string | null;
  engine_capacity: string | null;
  transmission: string | null;
  steering: string | null;
  body_type: string | null;
  exterior_color: string | null;
  year_manufactured: string | null;
  engine_type: string | null;
  interior_color: string | null;
  drive: string | null;
  mileage: string | null;
  doors: string | null;
  status: "available" | "sold";
  created_at: string;
}

function rowToListing(r: ListingRow, images: string[]) {
  return {
    id: r.id,
    shopId: r.shop_id,
    title: r.title,
    brand: r.brand ?? undefined,
    model: r.model ?? undefined,
    price: r.price ?? undefined,
    description: r.description ?? undefined,
    location: r.location ?? undefined,
    engineCapacity: r.engine_capacity ?? undefined,
    transmission: r.transmission ?? undefined,
    steering: r.steering ?? undefined,
    bodyType: r.body_type ?? undefined,
    exteriorColor: r.exterior_color ?? undefined,
    yearManufactured: r.year_manufactured ?? undefined,
    engineType: r.engine_type ?? undefined,
    interiorColor: r.interior_color ?? undefined,
    drive: r.drive ?? undefined,
    mileage: r.mileage ?? undefined,
    doors: r.doors ?? undefined,
    status: r.status,
    images,
    createdAt: r.created_at,
  };
}

const LISTING_SELECT = `
  SELECT id, shop_id, title, brand, model, price, description, location,
         engine_capacity, transmission, steering, body_type,
         exterior_color, year_manufactured, engine_type,
         interior_color, drive, mileage, doors,
         status, created_at
    FROM car_listings`;

async function loadWithImages(
  db: import("@cloudflare/workers-types").D1Database,
  shopId: string,
  listingId: string,
) {
  const row = await db
    .prepare(`${LISTING_SELECT} WHERE id = ? AND shop_id = ?`)
    .bind(listingId, shopId)
    .first<ListingRow>();
  if (!row) return null;
  const imgs = await db
    .prepare(
      `SELECT r2_key FROM car_listing_images
         WHERE listing_id = ? ORDER BY sort_order ASC`,
    )
    .bind(listingId)
    .all<{ r2_key: string }>();
  return rowToListing(row, (imgs.results ?? []).map((r) => r.r2_key));
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string; listingId: string } },
): Promise<Response> {
  const ctx = await requireCatalogRead(params.id);
  if (isResponse(ctx)) return ctx;
  const listing = await loadWithImages(ctx.db, ctx.shopId, params.listingId);
  if (!listing) return notFound("Listing not found");
  return Response.json({ listing });
}

type IncomingPatch = Partial<{
  brand: string;
  model: string;
  price: string;
  description: string;
  location: string;
  engineCapacity: string;
  transmission: string;
  steering: string;
  bodyType: string;
  exteriorColor: string;
  yearManufactured: string;
  engineType: string;
  interiorColor: string;
  drive: string;
  mileage: string;
  doors: string;
  status: "available" | "sold";
  /** Pass to replace the gallery atomically. Omit to leave photos alone. */
  images: string[];
}>;

const PATCH_MAP: Array<[keyof IncomingPatch, string, boolean]> = [
  ["brand", "brand", true],
  ["model", "model", true],
  ["price", "price", true],
  ["description", "description", true],
  ["location", "location", true],
  ["engineCapacity", "engine_capacity", true],
  ["transmission", "transmission", true],
  ["steering", "steering", true],
  ["bodyType", "body_type", true],
  ["exteriorColor", "exterior_color", true],
  ["yearManufactured", "year_manufactured", true],
  ["engineType", "engine_type", true],
  ["interiorColor", "interior_color", true],
  ["drive", "drive", true],
  ["mileage", "mileage", true],
  ["doors", "doors", true],
];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; listingId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const owns = await ctx.db
    .prepare("SELECT id FROM car_listings WHERE id = ? AND shop_id = ?")
    .bind(params.listingId, ctx.shopId)
    .first<{ id: string }>();
  if (!owns) return notFound("Listing not found");

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
  // Re-derive `title` when either half of the split changed, so any
  // legacy code that reads `title` directly sees the new value.
  if (body.brand !== undefined || body.model !== undefined) {
    const existing = await ctx.db
      .prepare("SELECT brand, model FROM car_listings WHERE id = ?")
      .bind(params.listingId)
      .first<{ brand: string | null; model: string | null }>();
    const nextBrand =
      (body.brand !== undefined ? body.brand : existing?.brand ?? "")?.trim() ?? "";
    const nextModel =
      (body.model !== undefined ? body.model : existing?.model ?? "")?.trim() ?? "";
    const composed = `${nextBrand} ${nextModel}`.trim();
    if (composed) {
      updates.push("title = ?");
      values.push(composed);
    }
  }
  if (body.status !== undefined) {
    if (body.status !== "available" && body.status !== "sold") {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.push("status = ?");
    values.push(body.status);
  }
  if (updates.length > 0) {
    values.push(params.listingId);
    await ctx.db
      .prepare(`UPDATE car_listings SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  // Atomic gallery replacement when `images` is passed.
  if (Array.isArray(body.images)) {
    const stmts = [
      ctx.db
        .prepare(`DELETE FROM car_listing_images WHERE listing_id = ?`)
        .bind(params.listingId),
    ];
    body.images.forEach((key, idx) => {
      if (typeof key === "string" && key.trim()) {
        stmts.push(
          ctx.db
            .prepare(
              `INSERT INTO car_listing_images (id, listing_id, r2_key, sort_order)
               VALUES (?, ?, ?, ?)`,
            )
            .bind(`img-${params.listingId}-${Date.now()}-${idx}`, params.listingId, key.trim(), idx),
        );
      }
    });
    await ctx.db.batch(stmts);
  }

  const listing = await loadWithImages(ctx.db, ctx.shopId, params.listingId);
  if (!listing) return notFound();
  return Response.json({ listing });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; listingId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;
  const result = await ctx.db
    .prepare("DELETE FROM car_listings WHERE id = ? AND shop_id = ?")
    .bind(params.listingId, ctx.shopId)
    .run();
  if (!result.meta.changes) return notFound("Listing not found");
  return Response.json({ ok: true });
}
