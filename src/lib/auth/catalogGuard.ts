/**
 * Shared authorization for "per-shop catalog" routes (cargo routes,
 * menu items, doctors, beauty services / stylists, meat products).
 *
 * The pattern is identical for each: a write must come from the shop's
 * owner (or an admin); a read is anonymous-OK as long as the shop is
 * approved. Returning typed Response shortcuts means each route file
 * stays focused on its own SQL.
 */

import type { D1Database } from "@cloudflare/workers-types";
import { forbidden, getServerContext, notFound, unauthorized } from "@/lib/auth/server";
import type { SessionUser } from "@/lib/auth/session";

export interface CatalogReadContext {
  db: D1Database;
  user: SessionUser | null;
  shopId: string;
}

export interface CatalogWriteContext {
  db: D1Database;
  user: SessionUser;
  shopId: string;
  isAdmin: boolean;
}

/**
 * For GET handlers — the catalog is publicly viewable when the shop
 * is approved; pending/rejected shops only show their catalog to the
 * owner or an admin.
 */
export async function requireCatalogRead(shopId: string): Promise<CatalogReadContext | Response> {
  const { db, user } = await getServerContext();
  const shop = await db
    .prepare("SELECT owner_id, status FROM shops WHERE id = ?")
    .bind(shopId)
    .first<{ owner_id: string; status: string }>();
  if (!shop) return notFound("Shop not found");

  const isAdmin = user?.role === "admin";
  const isOwner = user?.id === shop.owner_id;
  if (shop.status !== "approved" && !isOwner && !isAdmin) {
    return notFound("Shop not found");
  }
  return { db, user, shopId };
}

/**
 * For POST/PATCH/DELETE handlers — write access is owner-or-admin.
 * Returns a 401/403/404 Response on failure.
 */
export async function requireCatalogWrite(shopId: string): Promise<CatalogWriteContext | Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const shop = await db
    .prepare("SELECT owner_id FROM shops WHERE id = ?")
    .bind(shopId)
    .first<{ owner_id: string }>();
  if (!shop) return notFound("Shop not found");

  const isAdmin = user.role === "admin";
  const isOwner = user.id === shop.owner_id;
  if (!isOwner && !isAdmin) return forbidden();

  return { db, user, shopId, isAdmin };
}

/** Type guard for the union return. */
export function isResponse(x: unknown): x is Response {
  return typeof x === "object" && x !== null && "status" in x && typeof (x as Response).status === "number" && "headers" in x;
}
