/**
 * Convert between the D1 row shape (snake_case, INTEGER booleans,
 * separate shop_images / shop_notices tables) and the Shop interface
 * the client code already understands. Keeps row → object mapping in
 * one place so route handlers don't repeat themselves.
 */

import type { D1Database } from "@cloudflare/workers-types";
import type { Shop, ShopNotice, ShopStatus } from "@/lib/shopStore";
import type { ShopCategory } from "@/components/shop/types";

export interface ShopRow {
  id: string;
  owner_id: string;
  category: string;
  name: string;
  description: string | null;
  contact_phone: string | null;
  address: string | null;
  open_hours: string | null;
  facebook: string | null;
  instagram: string | null;
  status: ShopStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  featured: number;
  is_open: number;
  created_at: string;
}

/** Pure row → Shop conversion. Does NOT load images/notices joins. */
export function rowToShop(row: ShopRow, opts: { images?: string[]; notices?: ShopNotice[] } = {}): Shop {
  return {
    id: row.id,
    ownerId: row.owner_id,
    category: row.category as ShopCategory,
    name: row.name,
    description: row.description ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    address: row.address ?? undefined,
    openHours: row.open_hours ?? undefined,
    facebook: row.facebook ?? undefined,
    instagram: row.instagram ?? undefined,
    images: opts.images ?? [],
    status: row.status,
    rejectionReason: row.rejection_reason ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    featured: row.featured === 1,
    isOpen: row.is_open === 1,
    notices: opts.notices ?? [],
    createdAt: row.created_at,
  };
}

/**
 * Hydrate a list of shop rows with their images (R2 keys) and notices
 * in two extra queries (vs. one-per-shop N+1). Empty arrays when the
 * joins return nothing.
 */
export async function hydrateShops(db: D1Database, rows: ShopRow[]): Promise<Shop[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");

  const [imagesRes, noticesRes] = await Promise.all([
    db
      .prepare(
        `SELECT shop_id, r2_key, sort_order FROM shop_images
          WHERE shop_id IN (${placeholders})
          ORDER BY shop_id, sort_order`,
      )
      .bind(...ids)
      .all<{ shop_id: string; r2_key: string; sort_order: number }>(),
    db
      .prepare(
        `SELECT id, shop_id, title, content, created_at FROM shop_notices
          WHERE shop_id IN (${placeholders})
          ORDER BY shop_id, created_at DESC`,
      )
      .bind(...ids)
      .all<{ id: string; shop_id: string; title: string; content: string; created_at: string }>(),
  ]);

  const imagesByShop = new Map<string, string[]>();
  for (const r of imagesRes.results ?? []) {
    const arr = imagesByShop.get(r.shop_id) ?? [];
    arr.push(r.r2_key);
    imagesByShop.set(r.shop_id, arr);
  }

  const noticesByShop = new Map<string, ShopNotice[]>();
  for (const r of noticesRes.results ?? []) {
    const arr = noticesByShop.get(r.shop_id) ?? [];
    arr.push({
      id: r.id,
      title: r.title,
      content: r.content,
      createdAt: r.created_at,
    });
    noticesByShop.set(r.shop_id, arr);
  }

  return rows.map((row) =>
    rowToShop(row, {
      images: imagesByShop.get(row.id),
      notices: noticesByShop.get(row.id),
    }),
  );
}
