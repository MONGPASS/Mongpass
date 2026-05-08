/**
 * DELETE /api/shops/[id]/images/[r2Key] — remove one image from the
 * shop's gallery. Owner-only. Also deletes the R2 object so we don't
 * leak storage.
 *
 * The r2Key path segment is URL-encoded by the client (the keys
 * contain slashes).
 */

export const runtime = "edge";

import { isResponse, requireCatalogWrite } from "@/lib/auth/catalogGuard";
import { notFound } from "@/lib/auth/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; r2Key: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;
  const key = decodeURIComponent(params.r2Key);

  const result = await ctx.db
    .prepare("DELETE FROM shop_images WHERE shop_id = ? AND r2_key = ?")
    .bind(ctx.shopId, key)
    .run();
  if (!result.meta.changes) return notFound("Image not found");

  // Best-effort R2 delete; even if this fails, the shop row no longer
  // references it so the user-facing UX is correct.
  try {
    const { env } = getRequestContext();
    await (env as unknown as CloudflareEnv).IMAGES.delete(key);
  } catch {
    // ignore — orphaned R2 objects are a minor cleanup task, not a
    // request failure.
  }

  return Response.json({ ok: true });
}
