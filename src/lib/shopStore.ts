import { ShopCategory } from "@/components/shop/types";

export type ShopStatus = "pending" | "approved" | "rejected";

export const SHOP_STATUS_LABEL: Record<ShopStatus, string> = {
  pending: "Хүлээгдэж буй",
  approved: "Баталгаажсан",
  rejected: "Татгалзсан",
};

export interface Shop {
  id: string;
  ownerId: string;     // User.id
  category: ShopCategory;
  name: string;
  description?: string;
  contactPhone?: string;
  address?: string;
  /** "Даваа - Баасан: 09:00 - 18:00" — free-form for now */
  openHours?: string;
  facebook?: string;
  instagram?: string;
  /** base64 data URLs of uploaded shop photos */
  images?: string[];
  /** Approval state. New shops are "pending" until super admin reviews. */
  status: ShopStatus;
  /** Reason given when status === "rejected" */
  rejectionReason?: string;
  /** ISO timestamp of last admin review */
  reviewedAt?: string;
  /**
   * Admin-curated "Онцлох" (featured) flag. Featured shops surface in a
   * dedicated section on the home page. Future: this could be auto-set
   * by a paid subscription tier.
   */
  featured?: boolean;
  /**
   * Owner-controlled open/closed flag. Default true — undefined means
   * open. Closed shops still appear in listings but with a red badge
   * and a "currently closed" notice on the detail page.
   */
  isOpen?: boolean;
  /** Owner-authored announcements/news shown on the user-side InfoTab. */
  notices?: ShopNotice[];
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

const SHOPS_KEY = "mongpass:shops:v1";

export function loadShops(): Shop[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHOPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Shop[];
    if (!Array.isArray(parsed)) return [];
    // Migration: shops created before status existed are treated as approved.
    // New shops are always created with status: "pending".
    return parsed.map((s) => ({
      ...s,
      status: (s.status as ShopStatus | undefined) ?? "approved",
    }));
  } catch {
    return [];
  }
}

function saveShops(shops: Shop[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
}

export function newShopId(): string {
  return `shop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Returns the (first) shop owned by this user, or null. */
export function findShopByOwner(ownerId: string): Shop | null {
  return loadShops().find((s) => s.ownerId === ownerId) ?? null;
}

export function findShopById(id: string): Shop | null {
  return loadShops().find((s) => s.id === id) ?? null;
}

export function createShop(
  input: Omit<Shop, "id" | "createdAt" | "status">,
): Shop {
  const shop: Shop = {
    ...input,
    id: newShopId(),
    status: "pending",   // new shops always start pending
    createdAt: new Date().toISOString(),
  };
  saveShops([...loadShops(), shop]);
  return shop;
}

/** Get shops filtered by approval status. */
export function loadShopsByStatus(status: ShopStatus): Shop[] {
  return loadShops().filter((s) => s.status === status);
}

/** Approved shops only — what the user-facing app should ever show. */
export function loadApprovedShops(): Shop[] {
  return loadShops().filter((s) => s.status === "approved");
}

/** Approved + featured shops, used by the home "Онцлох" carousel. */
export function loadFeaturedShops(): Shop[] {
  return loadApprovedShops().filter((s) => s.featured === true);
}

/** Most recently approved shops, newest first. */
export function loadNewestApprovedShops(limit = 8): Shop[] {
  return loadApprovedShops()
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

/** Toggle featured flag — used by the admin dashboard. */
export function toggleFeatured(id: string): Shop | null {
  const shop = findShopById(id);
  if (!shop) return null;
  return updateShop(id, { featured: !shop.featured });
}

/** Toggle open/closed — used by the shop owner from /biz. */
export function toggleOpen(id: string): Shop | null {
  const shop = findShopById(id);
  if (!shop) return null;
  // undefined or true → close it; only false → open it
  const currentlyOpen = shop.isOpen !== false;
  return updateShop(id, { isOpen: !currentlyOpen });
}

export function isShopOpen(shop: Shop): boolean {
  return shop.isOpen !== false;
}

/** Approve a shop. Sets status="approved", clears rejectionReason. */
export function approveShop(id: string): Shop | null {
  return updateShop(id, {
    status: "approved",
    rejectionReason: undefined,
    reviewedAt: new Date().toISOString(),
  });
}

/** Reject a shop with a reason shown to its owner. */
export function rejectShop(id: string, reason: string): Shop | null {
  return updateShop(id, {
    status: "rejected",
    rejectionReason: reason,
    reviewedAt: new Date().toISOString(),
  });
}

export function updateShop(id: string, patch: Partial<Omit<Shop, "id" | "ownerId" | "createdAt">>): Shop | null {
  const shops = loadShops();
  const idx = shops.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const next = { ...shops[idx], ...patch };
  shops[idx] = next;
  saveShops(shops);
  return next;
}

export function deleteShop(id: string): void {
  saveShops(loadShops().filter((s) => s.id !== id));
}
