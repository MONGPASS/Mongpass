/** /api/shops/[id]/menu/[itemId] — update + delete a single menu item. */

export const runtime = "edge";

import { isResponse, requireCatalogWrite } from "@/lib/auth/catalogGuard";
import { notFound } from "@/lib/auth/server";

interface ItemRow {
  id: string;
  shop_id: string;
  category: string;
  name: string;
  description: string | null;
  price: string;
}

function rowToItem(r: ItemRow) {
  return {
    id: r.id,
    category: r.category,
    name: r.name,
    desc: r.description ?? "",
    price: r.price,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; itemId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const owns = await ctx.db
    .prepare("SELECT id FROM menu_items WHERE id = ? AND shop_id = ?")
    .bind(params.itemId, ctx.shopId)
    .first<{ id: string }>();
  if (!owns) return notFound("Item not found");

  const body = (await request.json()) as Partial<{
    category: string; name: string; desc: string; price: string;
  }>;
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [field, column] of [
    ["category", "category"],
    ["name", "name"],
    ["desc", "description"],
    ["price", "price"],
  ] as const) {
    if (body[field] !== undefined) {
      updates.push(`${column} = ?`);
      const v = body[field];
      values.push(field === "desc" ? (v?.trim() || null) : (v?.trim() ?? ""));
    }
  }
  if (updates.length > 0) {
    values.push(params.itemId);
    await ctx.db
      .prepare(`UPDATE menu_items SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, category, name, description, price
         FROM menu_items WHERE id = ?`,
    )
    .bind(params.itemId)
    .first<ItemRow>();
  if (!row) return notFound();
  return Response.json({ item: rowToItem(row) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; itemId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;
  const result = await ctx.db
    .prepare("DELETE FROM menu_items WHERE id = ? AND shop_id = ?")
    .bind(params.itemId, ctx.shopId)
    .run();
  if (!result.meta.changes) return notFound("Item not found");
  return Response.json({ ok: true });
}
