/**
 * /api/shops/[id]
 *   GET   — public if approved; owner/admin can see any status
 *   PATCH — update shop fields (owner only). If a previously-rejected
 *           shop is edited it implicitly re-enters review (status=pending).
 */

export const runtime = "edge";

import {
  forbidden,
  getServerContext,
  notFound,
  unauthorized,
} from "@/lib/auth/server";
import { hydrateShops, type ShopRow } from "@/lib/shops/dbMapper";

async function loadShop(
  db: import("@cloudflare/workers-types").D1Database,
  id: string,
) {
  const row = await db
    .prepare(
      `SELECT id, owner_id, category, name, description, contact_phone,
              address, open_hours, facebook, instagram, status,
              rejection_reason, reviewed_at, featured, is_open, created_at
         FROM shops WHERE id = ?`,
    )
    .bind(id)
    .first<ShopRow>();
  return row;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  const row = await loadShop(db, params.id);
  if (!row) return notFound("Shop not found");

  const isOwner = user && user.id === row.owner_id;
  const isAdmin = user?.role === "admin";
  if (row.status !== "approved" && !isOwner && !isAdmin) {
    return notFound("Shop not found");
  }

  const [shop] = await hydrateShops(db, [row]);
  return Response.json({ shop });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const row = await loadShop(db, params.id);
  if (!row) return notFound("Shop not found");
  if (row.owner_id !== user.id && user.role !== "admin") return forbidden();

  const body = (await request.json()) as Partial<{
    name: string;
    description: string;
    contactPhone: string;
    address: string;
    openHours: string;
    facebook: string;
    instagram: string;
  }>;

  // Only allow changing user-editable fields here. status / featured /
  // is_open / rejection_reason are mutated through dedicated routes.
  const updates: string[] = [];
  const values: unknown[] = [];
  if (body.name !== undefined) {
    if (!body.name.trim()) {
      return Response.json({ error: "name cannot be empty" }, { status: 400 });
    }
    updates.push("name = ?");
    values.push(body.name.trim());
  }
  for (const [field, column] of [
    ["description", "description"],
    ["contactPhone", "contact_phone"],
    ["address", "address"],
    ["openHours", "open_hours"],
    ["facebook", "facebook"],
    ["instagram", "instagram"],
  ] as const) {
    if (body[field] !== undefined) {
      updates.push(`${column} = ?`);
      values.push(body[field]?.trim() || null);
    }
  }

  // Editing a rejected shop bumps it back into review.
  if (row.status === "rejected") {
    updates.push("status = 'pending'", "rejection_reason = NULL");
  }

  if (updates.length === 0) {
    const [shop] = await hydrateShops(db, [row]);
    return Response.json({ shop });
  }

  values.push(params.id);
  await db
    .prepare(`UPDATE shops SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await loadShop(db, params.id);
  if (!updated) return notFound();
  const [shop] = await hydrateShops(db, [updated]);
  return Response.json({ shop });
}
