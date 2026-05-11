/** POST /api/shops/[id]/toggle-featured — admin only. */

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

  const row = await db
    .prepare("SELECT featured FROM shops WHERE id = ?")
    .bind(params.id)
    .first<{ featured: number }>();
  if (!row) return notFound("Shop not found");

  const next = row.featured === 1 ? 0 : 1;
  await db
    .prepare("UPDATE shops SET featured = ? WHERE id = ?")
    .bind(next, params.id)
    .run();

  const updated = await db
    .prepare(
      `SELECT id, owner_id, category, name, description, contact_phone,
              address, open_hours, facebook, instagram, status,
              rejection_reason, reviewed_at, featured, is_open,
              bank_account, delivery_fee, specialty, created_at
         FROM shops WHERE id = ?`,
    )
    .bind(params.id)
    .first<ShopRow>();
  if (!updated) return notFound();
  const [shop] = await hydrateShops(db, [updated]);
  return Response.json({ shop });
}
