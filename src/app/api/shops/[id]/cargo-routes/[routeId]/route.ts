/**
 * /api/shops/[id]/cargo-routes/[routeId]
 *   PATCH  — update a single route (owner / admin)
 *   DELETE — remove a route (owner / admin)
 */

export const runtime = "edge";

import { isResponse, requireCatalogWrite } from "@/lib/auth/catalogGuard";
import { notFound } from "@/lib/auth/server";

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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; routeId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  // Confirm the route belongs to this shop before letting the body
  // overwrite anything.
  const owns = await ctx.db
    .prepare("SELECT id FROM cargo_routes WHERE id = ? AND shop_id = ?")
    .bind(params.routeId, ctx.shopId)
    .first<{ id: string }>();
  if (!owns) return notFound("Route not found");

  const body = (await request.json()) as Partial<{
    type: "air" | "express" | "regular";
    fromCity: string;
    toCity: string;
    pricePerKg: string;
    transitDays: string;
    schedule: string | null;
  }>;

  const updates: string[] = [];
  const values: unknown[] = [];
  if (body.type !== undefined) {
    if (!["air", "express", "regular"].includes(body.type)) {
      return Response.json({ error: "Invalid type" }, { status: 400 });
    }
    updates.push("type = ?");
    values.push(body.type);
  }
  for (const [field, column] of [
    ["fromCity", "from_city"],
    ["toCity", "to_city"],
    ["pricePerKg", "price_per_kg"],
    ["transitDays", "transit_days"],
  ] as const) {
    if (body[field] !== undefined) {
      updates.push(`${column} = ?`);
      values.push(body[field]?.trim() ?? "");
    }
  }
  if (body.schedule !== undefined) {
    updates.push("schedule = ?");
    values.push(body.schedule ? body.schedule.trim() : null);
  }

  if (updates.length > 0) {
    values.push(params.routeId);
    await ctx.db
      .prepare(`UPDATE cargo_routes SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, type, from_city, to_city, price_per_kg,
              transit_days, schedule
         FROM cargo_routes WHERE id = ?`,
    )
    .bind(params.routeId)
    .first<RouteRow>();
  if (!row) return notFound();
  return Response.json({ route: rowToRoute(row) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; routeId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const result = await ctx.db
    .prepare("DELETE FROM cargo_routes WHERE id = ? AND shop_id = ?")
    .bind(params.routeId, ctx.shopId)
    .run();
  if (!result.meta.changes) return notFound("Route not found");
  return Response.json({ ok: true });
}
