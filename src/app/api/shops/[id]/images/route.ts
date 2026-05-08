/**
 * /api/shops/[id]/images
 *   GET  — list this shop's image keys (in sort order)
 *   POST — { r2Key } — append an already-uploaded R2 key to the shop's
 *          gallery. Owner-only.
 */

export const runtime = "edge";

import { isResponse, requireCatalogRead, requireCatalogWrite } from "@/lib/auth/catalogGuard";

interface ImageRow { shop_id: string; r2_key: string; sort_order: number }

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogRead(params.id);
  if (isResponse(ctx)) return ctx;
  const result = await ctx.db
    .prepare(
      `SELECT shop_id, r2_key, sort_order FROM shop_images
        WHERE shop_id = ? ORDER BY sort_order, rowid`,
    )
    .bind(ctx.shopId)
    .all<ImageRow>();
  return Response.json({ keys: (result.results ?? []).map((r) => r.r2_key) });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const body = (await request.json()) as { r2Key?: string };
  const key = body.r2Key?.trim();
  if (!key) return Response.json({ error: "r2Key required" }, { status: 400 });

  // Soft cap: don't let a shop accumulate more than 10 photos. Keeps
  // listing payloads light and storage tidy.
  const count = await ctx.db
    .prepare("SELECT COUNT(*) as c FROM shop_images WHERE shop_id = ?")
    .bind(ctx.shopId)
    .first<{ c: number }>();
  if ((count?.c ?? 0) >= 10) {
    return Response.json({ error: "Too many images (max 10)" }, { status: 409 });
  }

  await ctx.db
    .prepare(
      `INSERT INTO shop_images (shop_id, r2_key, sort_order)
       VALUES (?, ?, ?)`,
    )
    .bind(ctx.shopId, key, count?.c ?? 0)
    .run();

  return Response.json({ ok: true, key }, { status: 201 });
}
