export const runtime = "edge";

import { isResponse, requireCatalogWrite } from "@/lib/auth/catalogGuard";
import { notFound } from "@/lib/auth/server";

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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; serviceId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const owns = await ctx.db
    .prepare("SELECT id FROM beauty_services WHERE id = ? AND shop_id = ?")
    .bind(params.serviceId, ctx.shopId)
    .first<{ id: string }>();
  if (!owns) return notFound("Service not found");

  const body = (await request.json()) as Partial<{
    name: string; category: string; durationMin: string; price: string;
  }>;
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [field, column] of [
    ["name", "name"],
    ["category", "category"],
    ["price", "price"],
  ] as const) {
    if (body[field] !== undefined) {
      updates.push(`${column} = ?`);
      values.push(body[field]?.trim() ?? "");
    }
  }
  if (body.durationMin !== undefined) {
    const dur = Number(body.durationMin);
    if (!Number.isFinite(dur) || dur <= 0) {
      return Response.json({ error: "Invalid durationMin" }, { status: 400 });
    }
    updates.push("duration_min = ?");
    values.push(dur);
  }
  if (updates.length > 0) {
    values.push(params.serviceId);
    await ctx.db
      .prepare(`UPDATE beauty_services SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, name, category, duration_min, price
         FROM beauty_services WHERE id = ?`,
    )
    .bind(params.serviceId)
    .first<ServiceRow>();
  if (!row) return notFound();
  return Response.json({ service: rowToService(row) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; serviceId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;
  const result = await ctx.db
    .prepare("DELETE FROM beauty_services WHERE id = ? AND shop_id = ?")
    .bind(params.serviceId, ctx.shopId)
    .run();
  if (!result.meta.changes) return notFound("Service not found");
  return Response.json({ ok: true });
}
