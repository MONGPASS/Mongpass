/**
 * /api/shops
 *   GET  — list shops (filters: status, category, owner=mine, featured)
 *   POST — create a shop owned by the current user (auth required,
 *          status defaults to 'pending' regardless of input)
 */

export const runtime = "edge";

import { getServerContext, unauthorized } from "@/lib/auth/server";
import { hydrateShops, type ShopRow } from "@/lib/shops/dbMapper";

const ALLOWED_STATUSES = new Set(["pending", "approved", "rejected"]);

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const featured = url.searchParams.get("featured");
  const owner = url.searchParams.get("owner");
  const limitParam = url.searchParams.get("limit");

  const { db, user } = await getServerContext();

  // Authorization: anyone can see approved shops. To filter by other
  // statuses you must be admin (else only see your own non-approved).
  // owner=mine requires authentication.
  let effectiveOwnerId: string | null = null;
  if (owner === "mine") {
    if (!user) return unauthorized();
    effectiveOwnerId = user.id;
  }

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (status) {
    if (!ALLOWED_STATUSES.has(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    if (effectiveOwnerId === null && user?.role !== "admin" && status !== "approved") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    conditions.push("status = ?");
    values.push(status);
  } else if (effectiveOwnerId === null) {
    // Default for the public list: approved only.
    conditions.push("status = 'approved'");
  }

  if (category) {
    conditions.push("category = ?");
    values.push(category);
  }
  if (featured === "true") {
    conditions.push("featured = 1");
  }
  if (effectiveOwnerId) {
    conditions.push("owner_id = ?");
    values.push(effectiveOwnerId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(Number(limitParam) || 100, 200);

  const result = await db
    .prepare(
      `SELECT id, owner_id, category, name, description, contact_phone,
              address, open_hours, facebook, instagram, status,
              rejection_reason, reviewed_at, featured, is_open,
              bank_account, delivery_fee, created_at
         FROM shops
         ${where}
         ORDER BY created_at DESC
         LIMIT ?`,
    )
    .bind(...values, limit)
    .all<ShopRow>();

  const shops = await hydrateShops(db, result.results ?? []);
  return Response.json({ shops });
}

export async function POST(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const body = (await request.json()) as Partial<{
    category: string;
    name: string;
    description: string;
    contactPhone: string;
    address: string;
    openHours: string;
    facebook: string;
    instagram: string;
  }>;

  if (!body.category || !body.name?.trim()) {
    return Response.json(
      { error: "category and name are required" },
      { status: 400 },
    );
  }

  // One shop per user — enforce on the server too. The /biz/register
  // page already gates this but a determined client could bypass.
  const existing = await db
    .prepare("SELECT id FROM shops WHERE owner_id = ? LIMIT 1")
    .bind(user.id)
    .first<{ id: string }>();
  if (existing) {
    return Response.json(
      { error: "You already own a shop", shopId: existing.id },
      { status: 409 },
    );
  }

  const id = `shop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await db
    .prepare(
      `INSERT INTO shops (
         id, owner_id, category, name, description, contact_phone,
         address, open_hours, facebook, instagram
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      user.id,
      body.category,
      body.name.trim(),
      body.description?.trim() || null,
      body.contactPhone?.trim() || null,
      body.address?.trim() || null,
      body.openHours?.trim() || null,
      body.facebook?.trim() || null,
      body.instagram?.trim() || null,
    )
    .run();

  const row = await db
    .prepare(
      `SELECT id, owner_id, category, name, description, contact_phone,
              address, open_hours, facebook, instagram, status,
              rejection_reason, reviewed_at, featured, is_open,
              bank_account, delivery_fee, created_at
         FROM shops WHERE id = ?`,
    )
    .bind(id)
    .first<ShopRow>();

  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  const [shop] = await hydrateShops(db, [row]);
  return Response.json({ shop }, { status: 201 });
}
