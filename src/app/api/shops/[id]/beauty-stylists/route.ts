export const runtime = "edge";

import { isResponse, requireCatalogRead, requireCatalogWrite } from "@/lib/auth/catalogGuard";

interface StylistRow {
  id: string;
  shop_id: string;
  name: string;
  specialty: string | null;
  image_r2_key: string | null;
}

function rowToStylist(r: StylistRow) {
  return {
    id: r.id,
    name: r.name,
    specialty: r.specialty ?? undefined,
    imageDataUrl: undefined,
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
      `SELECT id, shop_id, name, specialty, image_r2_key
         FROM beauty_stylists WHERE shop_id = ? ORDER BY rowid`,
    )
    .bind(ctx.shopId)
    .all<StylistRow>();
  return Response.json({ stylists: (result.results ?? []).map(rowToStylist) });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const body = (await request.json()) as Partial<{ name: string; specialty: string }>;
  if (!body.name?.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const id = `st-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await ctx.db
    .prepare(
      `INSERT INTO beauty_stylists (id, shop_id, name, specialty)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, ctx.shopId, body.name.trim(), body.specialty?.trim() || null)
    .run();
  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, name, specialty, image_r2_key
         FROM beauty_stylists WHERE id = ?`,
    )
    .bind(id)
    .first<StylistRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  return Response.json({ stylist: rowToStylist(row) }, { status: 201 });
}
