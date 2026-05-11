/**
 * /api/shops/[id]/car-listings
 *   GET  — public list (any user can browse). One image per listing
 *          is included so the card grid doesn't N+1.
 *   POST — create a new listing (owner of the shop, or admin).
 *
 * Images are written through PATCH (the create body carries the
 * R2 keys uploaded in the previous step via /api/upload).
 */

export const runtime = "edge";

import { isResponse, requireCatalogRead, requireCatalogWrite } from "@/lib/auth/catalogGuard";

interface ListingRow {
  id: string;
  shop_id: string;
  title: string;
  price: string | null;
  description: string | null;
  location: string | null;
  engine_capacity: string | null;
  transmission: string | null;
  steering: string | null;
  body_type: string | null;
  exterior_color: string | null;
  year_manufactured: string | null;
  year_imported: string | null;
  engine_type: string | null;
  interior_color: string | null;
  leasing: string | null;
  drive: string | null;
  mileage: string | null;
  condition: string | null;
  doors: string | null;
  status: "available" | "sold";
  created_at: string;
}

function rowToListing(r: ListingRow, images: string[]) {
  return {
    id: r.id,
    shopId: r.shop_id,
    title: r.title,
    price: r.price ?? undefined,
    description: r.description ?? undefined,
    location: r.location ?? undefined,
    engineCapacity: r.engine_capacity ?? undefined,
    transmission: r.transmission ?? undefined,
    steering: r.steering ?? undefined,
    bodyType: r.body_type ?? undefined,
    exteriorColor: r.exterior_color ?? undefined,
    yearManufactured: r.year_manufactured ?? undefined,
    yearImported: r.year_imported ?? undefined,
    engineType: r.engine_type ?? undefined,
    interiorColor: r.interior_color ?? undefined,
    leasing: r.leasing ?? undefined,
    drive: r.drive ?? undefined,
    mileage: r.mileage ?? undefined,
    condition: r.condition ?? undefined,
    doors: r.doors ?? undefined,
    status: r.status,
    images,
    createdAt: r.created_at,
  };
}

interface IncomingListing {
  title?: string;
  price?: string;
  description?: string;
  location?: string;
  engineCapacity?: string;
  transmission?: string;
  steering?: string;
  bodyType?: string;
  exteriorColor?: string;
  yearManufactured?: string;
  yearImported?: string;
  engineType?: string;
  interiorColor?: string;
  leasing?: string;
  drive?: string;
  mileage?: string;
  condition?: string;
  doors?: string;
  status?: "available" | "sold";
  /** R2 keys, in display order. */
  images?: string[];
}

const COLUMN_MAP: Array<[keyof IncomingListing, string]> = [
  ["title", "title"],
  ["price", "price"],
  ["description", "description"],
  ["location", "location"],
  ["engineCapacity", "engine_capacity"],
  ["transmission", "transmission"],
  ["steering", "steering"],
  ["bodyType", "body_type"],
  ["exteriorColor", "exterior_color"],
  ["yearManufactured", "year_manufactured"],
  ["yearImported", "year_imported"],
  ["engineType", "engine_type"],
  ["interiorColor", "interior_color"],
  ["leasing", "leasing"],
  ["drive", "drive"],
  ["mileage", "mileage"],
  ["condition", "condition"],
  ["doors", "doors"],
];

const LISTING_SELECT = `
  SELECT id, shop_id, title, price, description, location,
         engine_capacity, transmission, steering, body_type,
         exterior_color, year_manufactured, year_imported, engine_type,
         interior_color, leasing, drive, mileage, condition, doors,
         status, created_at
    FROM car_listings`;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  // Listings are public — anyone browsing the shop can see cars.
  const ctx = await requireCatalogRead(params.id);
  if (isResponse(ctx)) return ctx;
  const rows = await ctx.db
    .prepare(`${LISTING_SELECT}
              WHERE shop_id = ?
              ORDER BY created_at DESC
              LIMIT 200`)
    .bind(ctx.shopId)
    .all<ListingRow>();
  const listings = rows.results ?? [];
  if (listings.length === 0) return Response.json({ listings: [] });

  // Pull images for all listings in one query rather than N+1.
  const ids = listings.map((l) => l.id);
  const placeholders = ids.map(() => "?").join(",");
  const imgs = await ctx.db
    .prepare(
      `SELECT listing_id, r2_key FROM car_listing_images
         WHERE listing_id IN (${placeholders})
         ORDER BY listing_id, sort_order ASC`,
    )
    .bind(...ids)
    .all<{ listing_id: string; r2_key: string }>();
  const byListing = new Map<string, string[]>();
  for (const r of imgs.results ?? []) {
    const arr = byListing.get(r.listing_id) ?? [];
    arr.push(r.r2_key);
    byListing.set(r.listing_id, arr);
  }
  return Response.json({
    listings: listings.map((l) => rowToListing(l, byListing.get(l.id) ?? [])),
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const body = (await request.json()) as IncomingListing;
  if (!body.title?.trim()) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const id = `car-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  // Build INSERT — every spec field is optional and stored as TEXT.
  const cols = ["id", "shop_id"];
  const placeholders: string[] = ["?", "?"];
  const values: unknown[] = [id, ctx.shopId];
  for (const [field, column] of COLUMN_MAP) {
    cols.push(column);
    placeholders.push("?");
    const v = body[field];
    if (field === "title") {
      values.push((v as string).trim());
    } else {
      values.push(typeof v === "string" && v.trim() ? v.trim() : null);
    }
  }
  const stmts = [
    ctx.db
      .prepare(`INSERT INTO car_listings (${cols.join(", ")}) VALUES (${placeholders.join(", ")})`)
      .bind(...values),
  ];

  // Image inserts, if any. R2 keys must have come from /api/upload.
  if (Array.isArray(body.images)) {
    body.images.forEach((key, idx) => {
      if (typeof key === "string" && key.trim()) {
        stmts.push(
          ctx.db
            .prepare(
              `INSERT INTO car_listing_images (id, listing_id, r2_key, sort_order)
               VALUES (?, ?, ?, ?)`,
            )
            .bind(`img-${id}-${idx}`, id, key.trim(), idx),
        );
      }
    });
  }
  await ctx.db.batch(stmts);

  const row = await ctx.db
    .prepare(`${LISTING_SELECT} WHERE id = ?`)
    .bind(id)
    .first<ListingRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  const imgs = await ctx.db
    .prepare(
      `SELECT r2_key FROM car_listing_images
         WHERE listing_id = ? ORDER BY sort_order ASC`,
    )
    .bind(id)
    .all<{ r2_key: string }>();
  return Response.json(
    { listing: rowToListing(row, (imgs.results ?? []).map((r) => r.r2_key)) },
    { status: 201 },
  );
}
