/**
 * Shop store — backed by `/api/shops/*` (D1). Most exported function
 * names are kept stable from the localStorage version so consumers
 * only need to swap to `await` at the call site.
 *
 * Notice CRUD is intentionally not in this file yet (Phase 7); the
 * `notices` field on a Shop is read-only here, hydrated from the API.
 */

import { ShopCategory } from "@/components/shop/types";

export type ShopStatus = "pending" | "approved" | "rejected";

export const SHOP_STATUS_LABEL: Record<ShopStatus, string> = {
  pending: "Хүлээгдэж буй",
  approved: "Баталгаажсан",
  rejected: "Татгалзсан",
};

export interface Shop {
  id: string;
  ownerId: string;
  category: ShopCategory;
  name: string;
  description?: string;
  contactPhone?: string;
  address?: string;
  openHours?: string;
  facebook?: string;
  instagram?: string;
  /** R2 object keys (Phase 5+); empty array until images are uploaded. */
  images?: string[];
  status: ShopStatus;
  rejectionReason?: string;
  reviewedAt?: string;
  featured?: boolean;
  isOpen?: boolean;
  notices?: ShopNotice[];
  /** Free-text bank info shown on order pages, e.g. "신한 110-..." */
  bankAccount?: string;
  /** Per-order delivery fee in KRW. Undefined when not configured. */
  deliveryFee?: number;
  /** Number of reviews. Computed server-side via aggregate join. */
  reviewCount?: number;
  /** Average rating 0..5, rounded to 1 decimal. 0 when no reviews. */
  avgRating?: number;
  createdAt: string;
}

export interface ShopNotice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export function newNoticeId(): string {
  return `notice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Pure predicate — no API call needed. */
export function isShopOpen(shop: Shop): boolean {
  return shop.isOpen !== false;
}

// ===================== HTTP helpers =====================

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    if (res.status === 404) return null as unknown as T;
    throw new Error(`GET ${url} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
  return (await res.json()) as T;
}

async function patchJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${url} failed: ${res.status}`);
  return (await res.json()) as T;
}

// ===================== Reads =====================

export async function loadShops(): Promise<Shop[]> {
  // Returns *approved* shops by default — matches the public-list intent
  // of the original localStorage helper. For other statuses, use the
  // status-specific helpers below.
  const data = await getJson<{ shops: Shop[] }>("/api/shops");
  return data?.shops ?? [];
}

export async function loadApprovedShops(): Promise<Shop[]> {
  return loadShops();
}

export async function loadShopsByStatus(status: ShopStatus): Promise<Shop[]> {
  const data = await getJson<{ shops: Shop[] }>(
    `/api/shops?status=${encodeURIComponent(status)}`,
  );
  return data?.shops ?? [];
}

export async function loadFeaturedShops(): Promise<Shop[]> {
  const data = await getJson<{ shops: Shop[] }>("/api/shops?featured=true");
  return data?.shops ?? [];
}

export async function loadNewestApprovedShops(limit = 8): Promise<Shop[]> {
  const data = await getJson<{ shops: Shop[] }>(
    `/api/shops?limit=${encodeURIComponent(limit)}`,
  );
  return data?.shops ?? [];
}

export async function findShopByOwner(ownerId: string): Promise<Shop | null> {
  void ownerId; // intentionally unused: the API derives ownership from the session
  const data = await getJson<{ shops: Shop[] }>("/api/shops?owner=mine");
  return data?.shops?.[0] ?? null;
}

export async function findShopById(id: string): Promise<Shop | null> {
  const data = await getJson<{ shop: Shop | null }>(
    `/api/shops/${encodeURIComponent(id)}`,
  );
  return data?.shop ?? null;
}

// ===================== Writes =====================

export async function createShop(
  input: Omit<Shop, "id" | "createdAt" | "status">,
): Promise<Shop | null> {
  // The server derives ownerId from the session, ignoring whatever the
  // client passes for ownerId/status/createdAt.
  const data = await postJson<{ shop: Shop }>("/api/shops", {
    category: input.category,
    name: input.name,
    description: input.description,
    contactPhone: input.contactPhone,
    address: input.address,
    openHours: input.openHours,
    facebook: input.facebook,
    instagram: input.instagram,
  });
  return data?.shop ?? null;
}

export async function updateShop(
  id: string,
  patch: Partial<
    Pick<Shop, "name" | "description" | "contactPhone" | "address" | "openHours" | "facebook" | "instagram" | "bankAccount">
  > & {
    /** null is allowed and means "clear the value". */
    deliveryFee?: number | null;
  },
): Promise<Shop | null> {
  const data = await patchJson<{ shop: Shop }>(
    `/api/shops/${encodeURIComponent(id)}`,
    patch,
  );
  return data?.shop ?? null;
}

export async function approveShop(id: string): Promise<Shop | null> {
  const data = await postJson<{ shop: Shop }>(
    `/api/shops/${encodeURIComponent(id)}/approve`,
  );
  return data?.shop ?? null;
}

export async function rejectShop(id: string, reason: string): Promise<Shop | null> {
  const data = await postJson<{ shop: Shop }>(
    `/api/shops/${encodeURIComponent(id)}/reject`,
    { reason },
  );
  return data?.shop ?? null;
}

export async function toggleFeatured(id: string): Promise<Shop | null> {
  const data = await postJson<{ shop: Shop }>(
    `/api/shops/${encodeURIComponent(id)}/toggle-featured`,
  );
  return data?.shop ?? null;
}

export async function toggleOpen(id: string): Promise<Shop | null> {
  const data = await postJson<{ shop: Shop }>(
    `/api/shops/${encodeURIComponent(id)}/toggle-open`,
  );
  return data?.shop ?? null;
}
