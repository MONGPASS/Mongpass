/**
 * Notifications are *derived* from existing data — orders + shops —
 * rather than stored as separate records. The only persisted state is
 * a per-user `last_seen_at` timestamp; anything created after that is
 * unread.
 *
 * Phase 3 moves both the order data and the seen-state to D1, so the
 * unread badge follows the user across devices.
 */

import {
  Order,
  OrderStatus,
  getStatusLabel,
  loadOrders,
} from "@/lib/orderStore";
import { ShopCategory } from "@/components/shop/types";
import { findShopById, findShopByOwner, loadShopsByStatus } from "@/lib/shopStore";
import { User } from "@/lib/userStore";

export type NotificationKind =
  | "order-status"
  | "new-order"
  | "shop-pending";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  createdAt: string;
}

// ===================== Seen state (D1-backed via /api/notifications/seen) =====================

let cachedLastSeenAt: string | null | undefined = undefined;
let pendingFetch: Promise<string | null> | null = null;

async function fetchLastSeen(): Promise<string | null> {
  if (cachedLastSeenAt !== undefined) return cachedLastSeenAt;
  if (pendingFetch) return pendingFetch;
  pendingFetch = (async () => {
    try {
      const res = await fetch("/api/notifications/seen", { credentials: "same-origin" });
      if (!res.ok) {
        cachedLastSeenAt = null;
        return null;
      }
      const data = (await res.json()) as { lastSeenAt: string | null };
      cachedLastSeenAt = data.lastSeenAt;
      return data.lastSeenAt;
    } catch {
      cachedLastSeenAt = null;
      return null;
    } finally {
      pendingFetch = null;
    }
  })();
  return pendingFetch;
}

/** Async wrapper kept under the same name so consumers don't have to change. */
export async function getLastSeenAt(userId: string | null): Promise<string | null> {
  // userId is unused (the API uses the session) but kept for source compat.
  void userId;
  return fetchLastSeen();
}

export async function markAllNotificationsSeen(userId: string | null): Promise<void> {
  void userId;
  try {
    const res = await fetch("/api/notifications/seen", {
      method: "POST",
      credentials: "same-origin",
    });
    if (res.ok) {
      const data = (await res.json()) as { lastSeenAt: string };
      cachedLastSeenAt = data.lastSeenAt;
    }
  } catch {
    // Network error — leave the cache; the next page load will try again.
  }
}

// ===================== Notification builders =====================

/** Helper for a shop owner — collect orders they should be notified about. */
async function loadOwnerPendingOrders(userId: string): Promise<{ shop: { id: string; name: string }; order: Order }[]> {
  // Each user owns at most one shop (enforced server-side); fetch its
  // pending orders if there is one.
  const shop = await findShopByOwner(userId);
  if (!shop) return [];
  const list = await loadOrders({ shopId: shop.id, status: "pending" });
  return list.map((order) => ({ shop: { id: shop.id, name: shop.name }, order }));
}

export async function buildNotifications(user: User | null): Promise<Notification[]> {
  if (!user) return [];

  const out: Notification[] = [];

  // Customer side: status updates on the user's own orders.
  const myOrders = await loadOrders({ mine: true });
  for (const order of myOrders) {
    const eventAt = order.statusUpdatedAt ?? order.createdAt;
    out.push({
      id: `${order.id}:status:${order.status}`,
      kind: "order-status",
      title: await orderTitle(order),
      body: customerStatusBody(order.shopCategory, order.status),
      href: `/profile/orders/${order.id}`,
      createdAt: eventAt,
    });
  }

  // Shop owner side: new (pending) orders to any shop they own.
  const ownerOrders = await loadOwnerPendingOrders(user.id);
  for (const { shop, order } of ownerOrders) {
    out.push({
      id: `${order.id}:new-order`,
      kind: "new-order",
      title: `Шинэ захиалга — ${shop.name}`,
      body: await orderTitle(order),
      href: "/biz",
      createdAt: order.createdAt,
    });
  }

  // Admin side: pending shops awaiting review.
  if (user.role === "admin") {
    const pending = await loadShopsByStatus("pending");
    for (const shop of pending) {
      out.push({
        id: `${shop.id}:shop-pending`,
        kind: "shop-pending",
        title: "Шинэ дэлгүүр баталгаажуулалт хүлээж байна",
        body: shop.name,
        href: "/admin",
        createdAt: shop.createdAt,
      });
    }
  }

  return out.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function countUnread(user: User | null): Promise<number> {
  const [list, lastSeen] = await Promise.all([
    buildNotifications(user),
    fetchLastSeen(),
  ]);
  const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : 0;
  return list.filter((n) => new Date(n.createdAt).getTime() > lastSeenMs).length;
}

function customerStatusBody(category: ShopCategory, status: OrderStatus): string {
  if (status === "cancelled") return "Захиалга цуцлагдсан";
  if (status === "pending") {
    if (category === "hospital" || category === "beauty") {
      return "Хүсэлт амжилттай илгээгдлээ. Удахгүй холбогдоно";
    }
    return "Захиалга илгээгдлээ. Удахгүй баталгаажна";
  }
  if (status === "delivered") {
    if (category === "hospital" || category === "beauty") return "Үйлчилгээ дууссан";
    return "Захиалга хүргэгдсэн!";
  }
  return getStatusLabel(category, status);
}

async function orderTitle(order: Order): Promise<string> {
  const shop = await findShopById(order.shopId);
  const shopName = shop?.name ?? "Дэлгүүр";
  switch (order.shopCategory) {
    case "cargo":
      return `${shopName} — ${order.routeSnapshot.fromCity} → ${order.routeSnapshot.toCity}`;
    case "restaurant":
    case "food":
      return `${shopName} — ${order.items.length} зүйл`;
    case "hospital":
      return `${shopName} — ${order.doctorSnapshot.name}`;
    case "beauty":
      return `${shopName} — ${order.serviceSnapshot.name}`;
    default:
      return shopName;
  }
}
