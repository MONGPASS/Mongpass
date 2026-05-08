/** /api/shops/[id]/menu — list + create restaurant menu items. */

export const runtime = "edge";

import { isResponse, requireCatalogRead, requireCatalogWrite } from "@/lib/auth/catalogGuard";

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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogRead(params.id);
  if (isResponse(ctx)) return ctx;
  const result = await ctx.db
    .prepare(
      `SELECT id, shop_id, category, name, description, price
         FROM menu_items WHERE shop_id = ?
         ORDER BY category, rowid`,
    )
    .bind(ctx.shopId)
    .all<ItemRow>();
  return Response.json({ items: (result.results ?? []).map(rowToItem) });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const body = (await request.json()) as Partial<{
    category: string; name: string; desc: string; price: string;
  }>;
  if (!body.category?.trim() || !body.name?.trim() || !body.price?.trim()) {
    return Response.json({ error: "category, name, price are required" }, { status: 400 });
  }

  const id = `mi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await ctx.db
    .prepare(
      `INSERT INTO menu_items (id, shop_id, category, name, description, price)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, ctx.shopId, body.category.trim(), body.name.trim(), body.desc?.trim() || null, body.price.trim())
    .run();
  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, category, name, description, price
         FROM menu_items WHERE id = ?`,
    )
    .bind(id)
    .first<ItemRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  return Response.json({ item: rowToItem(row) }, { status: 201 });
}
