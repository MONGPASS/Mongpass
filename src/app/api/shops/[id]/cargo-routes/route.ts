/**
 * /api/shops/[id]/cargo-routes
 *   GET  — list this shop's cargo routes (public for approved shops)
 *   POST — create a new route (owner or admin)
 */

export const runtime = "edge";

import { isResponse, requireCatalogRead, requireCatalogWrite } from "@/lib/auth/catalogGuard";

interface RouteRow {
  id: string;
  shop_id: string;
  type: "air" | "express" | "regular";
  from_city: string;
  to_city: string;
  price_per_kg: string;
  transit_days: string;
  schedule: string | null;
}

function rowToRoute(r: RouteRow) {
  return {
    id: r.id,
    type: r.type,
    fromCity: r.from_city,
    toCity: r.to_city,
    pricePerKg: r.price_per_kg,
    transitDays: r.transit_days,
    schedule: r.schedule ?? undefined,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogRead(params.id);
  if (isResponse(ctx)) return ctx;

  const result = await ctx.db
    .prepare(
      `SELECT id, shop_id, type, from_city, to_city, price_per_kg,
              transit_days, schedule
         FROM cargo_routes WHERE shop_id = ?
         ORDER BY rowid`,
    )
    .bind(ctx.shopId)
    .all<RouteRow>();

  return Response.json({ routes: (result.results ?? []).map(rowToRoute) });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const body = (await request.json()) as Partial<{
    type: "air" | "express" | "regular";
    fromCity: string;
    toCity: string;
    pricePerKg: string;
    transitDays: string;
    schedule: string;
  }>;

  if (!body.type || !["air", "express", "regular"].includes(body.type)) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!body.fromCity?.trim() || !body.toCity?.trim() || !body.pricePerKg?.trim()) {
    return Response.json(
      { error: "fromCity, toCity, pricePerKg are required" },
      { status: 400 },
    );
  }

  const id = `route-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await ctx.db
    .prepare(
      `INSERT INTO cargo_routes (
         id, shop_id, type, from_city, to_city, price_per_kg, transit_days, schedule
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      ctx.shopId,
      body.type,
      body.fromCity.trim(),
      body.toCity.trim(),
      body.pricePerKg.trim(),
      body.transitDays?.trim() ?? "",
      body.schedule?.trim() || null,
    )
    .run();

  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, type, from_city, to_city, price_per_kg,
              transit_days, schedule
         FROM cargo_routes WHERE id = ?`,
    )
    .bind(id)
    .first<RouteRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  return Response.json({ route: rowToRoute(row) }, { status: 201 });
}
