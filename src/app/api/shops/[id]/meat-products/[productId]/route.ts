export const runtime = "edge";

import { isResponse, requireCatalogWrite } from "@/lib/auth/catalogGuard";
import { notFound } from "@/lib/auth/server";

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
    imageR2Key: r.image_r2_key ?? undefined,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; productId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const owns = await ctx.db
    .prepare("SELECT id FROM meat_products WHERE id = ? AND shop_id = ?")
    .bind(params.productId, ctx.shopId)
    .first<{ id: string }>();
  if (!owns) return notFound("Product not found");

  const body = (await request.json()) as Partial<{
    category: string; name: string; description: string; price: string; unit: string;
    /** Pass `null` to clear the image, a key string to set it. Omit to leave unchanged. */
    imageR2Key: string | null;
  }>;
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [field, column] of [
    ["category", "category"],
    ["name", "name"],
    ["price", "price"],
    ["unit", "unit"],
  ] as const) {
    if (body[field] !== undefined) {
      updates.push(`${column} = ?`);
      values.push(body[field]?.trim() ?? "");
    }
  }
  if (body.description !== undefined) {
    updates.push("description = ?");
    values.push(body.description.trim() || null);
  }
  if (body.imageR2Key !== undefined) {
    updates.push("image_r2_key = ?");
    values.push(
      typeof body.imageR2Key === "string" && body.imageR2Key.trim()
        ? body.imageR2Key.trim()
        : null,
    );
  }
  if (updates.length > 0) {
    values.push(params.productId);
    await ctx.db
      .prepare(`UPDATE meat_products SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, category, name, description, price, unit, image_r2_key
         FROM meat_products WHERE id = ?`,
    )
    .bind(params.productId)
    .first<ProductRow>();
  if (!row) return notFound();
  return Response.json({ product: rowToProduct(row) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; productId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;
  const result = await ctx.db
    .prepare("DELETE FROM meat_products WHERE id = ? AND shop_id = ?")
    .bind(params.productId, ctx.shopId)
    .run();
  if (!result.meta.changes) return notFound("Product not found");
  return Response.json({ ok: true });
}
