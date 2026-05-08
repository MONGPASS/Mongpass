/** POST /api/shops/[id]/approve — admin only. */

export const runtime = "edge";

import { forbidden, getServerContext, notFound, unauthorized } from "@/lib/auth/server";
import { hydrateShops, type ShopRow } from "@/lib/shops/dbMapper";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const result = await db
    .prepare(
      `UPDATE shops
          SET status = 'approved',
              reviewed_at = datetime('now'),
              rejection_reason = NULL
        WHERE id = ?`,
    )
    .bind(params.id)
    .run();

  if (!result.meta.changes) return notFound("Shop not found");

  const row = await db
    .prepare(
      `SELECT id, owner_id, category, name, description, contact_phone,
              address, open_hours, facebook, instagram, status,
              rejection_reason, reviewed_at, featured, is_open, created_at
         FROM shops WHERE id = ?`,
    )
    .bind(params.id)
    .first<ShopRow>();
  if (!row) return notFound("Shop not found");
  const [shop] = await hydrateShops(db, [row]);
  return Response.json({ shop });
}
