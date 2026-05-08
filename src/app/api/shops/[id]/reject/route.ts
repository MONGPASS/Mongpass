/** POST /api/shops/[id]/reject — admin only. Body: { reason: string } */

export const runtime = "edge";

import { forbidden, getServerContext, notFound, unauthorized } from "@/lib/auth/server";
import { hydrateShops, type ShopRow } from "@/lib/shops/dbMapper";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const body = (await request.json().catch(() => ({}))) as { reason?: string };
  const reason = body.reason?.trim() || null;

  const result = await db
    .prepare(
      `UPDATE shops
          SET status = 'rejected',
              reviewed_at = datetime('now'),
              rejection_reason = ?
        WHERE id = ?`,
    )
    .bind(reason, params.id)
    .run();

  if (!result.meta.changes) return notFound("Shop not found");

  const row = await db
    .prepare(
      `SELECT id, owner_id, category, name, description, contact_phone,
              address, open_hours, facebook, instagram, status,
              rejection_reason, reviewed_at, featured, is_open,
              bank_account, delivery_fee, created_at
         FROM shops WHERE id = ?`,
    )
    .bind(params.id)
    .first<ShopRow>();
  if (!row) return notFound();
  const [shop] = await hydrateShops(db, [row]);
  return Response.json({ shop });
}
