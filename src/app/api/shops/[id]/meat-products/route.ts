export const runtime = "edge";

import { isResponse, requireCatalogRead, requireCatalogWrite } from "@/lib/auth/catalogGuard";

interface ProductRow {
  id: string;
  shop_id: string;
  category: string;
  name: string;
  description: string | null;
  price: string;
  unit: string;
  image_r2_key: string | null;
}

function rowToProduct(r: ProductRow) {
  return {
    id: r.id,
    category: r.category,
    name: r.name,
    description: r.description ?? "",
    price: r.price,
    unit: r.unit,
    // R2 key — the client wraps it with r2Url() to render. We send the
    // raw key (not /api/r2/<key>) so consumers can also use it in
    // non-render contexts (e.g. order snapshots).
    imageR2Key: r.image_r2_key ?? undefined,
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
      `SELECT id, shop_id, category, name, description, price, unit, image_r2_key
         FROM meat_products WHERE shop_id = ? ORDER BY category, rowid`,
    )
    .bind(ctx.shopId)
    .all<ProductRow>();
  return Response.json({ products: (result.results ?? []).map(rowToProduct) });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const body = (await request.json()) as Partial<{
    category: string; name: string; description: string; price: string; unit: string;
    imageR2Key: string | null;
  }>;
  if (!body.category?.trim() || !body.name?.trim() || !body.price?.trim() || !body.unit?.trim()) {
    return Response.json({ error: "category, name, price, unit are required" }, { status: 400 });
  }

  const id = `mp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const imageKey =
    typeof body.imageR2Key === "string" && body.imageR2Key.trim()
      ? body.imageR2Key.trim()
      : null;
  await ctx.db
    .prepare(
      `INSERT INTO meat_products (id, shop_id, category, name, description, price, unit, image_r2_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      ctx.shopId,
      body.category.trim(),
      body.name.trim(),
      body.description?.trim() || null,
      body.price.trim(),
      body.unit.trim(),
      imageKey,
    )
    .run();
  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, category, name, description, price, unit, image_r2_key
         FROM meat_products WHERE id = ?`,
    )
    .bind(id)
    .first<ProductRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  return Response.json({ product: rowToProduct(row) }, { status: 201 });
}
