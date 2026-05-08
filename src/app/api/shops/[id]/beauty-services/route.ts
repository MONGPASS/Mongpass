export const runtime = "edge";

import { isResponse, requireCatalogRead, requireCatalogWrite } from "@/lib/auth/catalogGuard";

interface ServiceRow {
  id: string;
  shop_id: string;
  name: string;
  category: string;
  duration_min: number;
  price: string;
}

function rowToService(r: ServiceRow) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    durationMin: String(r.duration_min),
    price: r.price,
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
      `SELECT id, shop_id, name, category, duration_min, price
         FROM beauty_services WHERE shop_id = ? ORDER BY category, rowid`,
    )
    .bind(ctx.shopId)
    .all<ServiceRow>();
  return Response.json({ services: (result.results ?? []).map(rowToService) });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const body = (await request.json()) as Partial<{
    name: string; category: string; durationMin: string; price: string;
  }>;
  const dur = Number(body.durationMin);
  if (!body.name?.trim() || !body.category?.trim() || !body.price?.trim() || !Number.isFinite(dur) || dur <= 0) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const id = `bs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await ctx.db
    .prepare(
      `INSERT INTO beauty_services (id, shop_id, name, category, duration_min, price)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, ctx.shopId, body.name.trim(), body.category.trim(), dur, body.price.trim())
    .run();
  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, name, category, duration_min, price
         FROM beauty_services WHERE id = ?`,
    )
    .bind(id)
    .first<ServiceRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  return Response.json({ service: rowToService(row) }, { status: 201 });
}
