export const runtime = "edge";

import { isResponse, requireCatalogWrite } from "@/lib/auth/catalogGuard";
import { notFound } from "@/lib/auth/server";

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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; stylistId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const owns = await ctx.db
    .prepare("SELECT id FROM beauty_stylists WHERE id = ? AND shop_id = ?")
    .bind(params.stylistId, ctx.shopId)
    .first<{ id: string }>();
  if (!owns) return notFound("Stylist not found");

  const body = (await request.json()) as Partial<{ name: string; specialty: string }>;
  const updates: string[] = [];
  const values: unknown[] = [];
  if (body.name !== undefined) {
    updates.push("name = ?");
    values.push(body.name.trim());
  }
  if (body.specialty !== undefined) {
    updates.push("specialty = ?");
    values.push(body.specialty.trim() || null);
  }
  if (updates.length > 0) {
    values.push(params.stylistId);
    await ctx.db
      .prepare(`UPDATE beauty_stylists SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, name, specialty, image_r2_key
         FROM beauty_stylists WHERE id = ?`,
    )
    .bind(params.stylistId)
    .first<StylistRow>();
  if (!row) return notFound();
  return Response.json({ stylist: rowToStylist(row) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; stylistId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;
  const result = await ctx.db
    .prepare("DELETE FROM beauty_stylists WHERE id = ? AND shop_id = ?")
    .bind(params.stylistId, ctx.shopId)
    .run();
  if (!result.meta.changes) return notFound("Stylist not found");
  return Response.json({ ok: true });
}
