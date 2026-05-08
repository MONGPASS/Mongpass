import {
  Order,
  OrderStatus,
  getStatusLabel,
  loadOrders,
} from "@/lib/orderStore";
import { ShopCategory } from "@/components/shop/types";
import { findShopById, loadShopsByStatus } from "@/lib/shopStore";
import { loadMyOrderIds } from "@/lib/myOrdersStore";
import { User } from "@/lib/userStore";

/**
 * Notifications are *derived* from existing data — orders, shops, etc.
 * — rather than stored as separate records. The only persisted state is
 * a per-user "lastSeenAt" timestamp; anything created after that is
 * considered unread.
 *
 * When we move to a real backend we'd swap the derivation for a proper
 * notifications table with push/email triggers, but the read-state UX
 * (bell icon + unread count) stays the same.
 */

export type NotificationKind =
  | "order-status"     // your order changed status
  | "new-order"        // shop owner: new order received
  | "shop-pending";    // admin: new shop awaiting review

export interface Notification {
  id: string;          // stable per-source-event id
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;        // deep link target
  createdAt: string;   // ISO
}

const SEEN_KEY_PREFIX = "mongpass:notifications:lastSeenAt:";

export function getLastSeenAt(userId: string | null): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SEEN_KEY_PREFIX + (userId ?? "anon"));
}

export function markAllNotificationsSeen(userId: string | null): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEEN_KEY_PREFIX + (userId ?? "anon"), new Date().toISOString());
}

/**
 * Build the notification feed for a given user. Order: newest first.
 * Different roles see different sources:
 *  - Every user sees status updates on their own orders (customer side)
 *  - Shop owners see new orders to their shop
 *  - Admins see shops awaiting approval
 */
export async function buildNotifications(user: User | null): Promise<Notification[]> {
  if (!user) return [];

  const out: Notification[] = [];

  // Customer side: orders the user submitted. Orders themselves are
  // still localStorage in Phase 2; Phase 3 will move them to D1.
  const myOrderIds = new Set(loadMyOrderIds());
  const allOrders = loadOrders();
  for (const order of allOrders) {
    if (!myOrderIds.has(order.id)) continue;
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

  // Shop owner side: new (pending) orders to their shop
  const approved = await loadShopsByStatus("approved");
  const ownedShops = approved.filter((s) => s.ownerId === user.id);
  for (const shop of ownedShops) {
    const pendingOrders = allOrders.filter(
      (o) => o.shopId === shop.id && o.status === "pending",
    );
    for (const order of pendingOrders) {
      out.push({
        id: `${order.id}:new-order`,
        kind: "new-order",
        title: `Шинэ захиалга — ${shop.name}`,
        body: await orderTitle(order),
        href: "/biz",
        createdAt: order.createdAt,
      });
    }
  }

  // Admin side: pending shops awaiting review
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
  const lastSeen = getLastSeenAt(user?.id ?? null);
  const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : 0;
  const list = await buildNotifications(user);
  return list.filter((n) => new Date(n.createdAt).getTime() > lastSeenMs).length;
}

/**
 * Friendly customer-facing status message — sounds more natural than
 * "status updated to: pending" for the common cases.
 */
function customerStatusBody(category: ShopCategory, status: OrderStatus): string {
  if (status === "cancelled") return "Захиалга цуцлагдсан";
  // First touch — "your order is in"
  if (status === "pending") {
    if (category === "hospital" || category === "beauty") {
      return "Хүсэлт амжилттай илгээгдлээ. Удахгүй холбогдоно";
    }
    return "Захиалга илгээгдлээ. Удахгүй баталгаажна";
  }
  // Final delivery state — celebrate it slightly
  if (status === "delivered") {
    if (category === "hospital" || category === "beauty") return "Үйлчилгээ дууссан";
    return "Захиалга хүргэгдсэн!";
  }
  // Everything else — fall back to the localised status label
  return getStatusLabel(category, status);
}

/** Best-effort, human-readable title for a notification about an order. */
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
