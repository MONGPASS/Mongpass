import { Order, loadOrders } from "@/lib/orderStore";

const KEY = "mongpass:my-orders:v1";

export function loadMyOrderIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMyOrderIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(ids));
}

/**
 * Mark this order ID as belonging to the current user. Idempotent —
 * calling repeatedly with the same ID won't duplicate.
 */
export function addMyOrderId(id: string): void {
  const ids = loadMyOrderIds();
  if (ids.includes(id)) return;
  saveMyOrderIds([id, ...ids]);
}

/**
 * Return the user's orders, newest first. Orders that are missing from
 * the global store (e.g. cleared) are silently dropped.
 */
export function loadMyOrders(): Order[] {
  const ids = new Set(loadMyOrderIds());
  return loadOrders().filter((o) => ids.has(o.id));
}
