import { ShopCategory } from "@/components/shop/types";
import { CargoType } from "@/lib/cargoStore";

export type OrderStatus =
  | "pending"      // Хүлээгдэж буй — sent, awaiting acknowledgement
  | "received"     // Хүлээн авсан — shop confirmed
  | "in_transit"  // Тээвэрлэгдэж буй — in progress
  | "delivered"    // Хүргэгдсэн — completed
  | "cancelled";  // Цуцлагдсан

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Хүлээгдэж буй",
  received: "Хүлээн авсан",
  in_transit: "Тээвэрлэгдэж буй",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "received",
  "in_transit",
  "delivered",
];

const STATUS_LABEL_BY_CATEGORY: Partial<
  Record<ShopCategory, Partial<Record<OrderStatus, string>>>
> = {
  cargo: {
    pending: "Хүлээгдэж буй",
    received: "Хүлээн авсан",
    in_transit: "Тээвэрлэгдэж буй",
    delivered: "Хүргэгдсэн",
  },
  restaurant: {
    pending: "Хүлээгдэж буй",
    received: "Баталгаажсан",
    in_transit: "Бэлдэж буй",
    delivered: "Хүргэгдсэн",
  },
  food: {
    pending: "Хүлээгдэж буй",
    received: "Баталгаажсан",
    in_transit: "Бэлдэж буй",
    delivered: "Хүргэгдсэн",
  },
  hospital: {
    pending: "Хүсэлт илгээгдсэн",
    received: "Баталгаажсан",
    delivered: "Дууссан",
  },
  beauty: {
    pending: "Хүсэлт илгээгдсэн",
    received: "Баталгаажсан",
    delivered: "Дууссан",
  },
  meat: {
    // Kept short so the 4-step timeline on the order detail page
    // doesn't overflow on mobile widths. Full phrase ("Шилжүүлэг
    // хүлээж буй") fits the badge but cramps the timeline.
    pending: "Төлбөр хүлээж",
    received: "Баталгаажсан",
    in_transit: "Бэлдэж буй",
    delivered: "Хүргэгдсэн",
  },
};

const APPOINTMENT_FLOW: OrderStatus[] = ["pending", "received", "delivered"];

export function getStatusFlow(category: ShopCategory): OrderStatus[] {
  if (category === "hospital" || category === "beauty") return APPOINTMENT_FLOW;
  return ORDER_STATUS_FLOW;
}

export function getStatusLabel(category: ShopCategory, status: OrderStatus): string {
  return STATUS_LABEL_BY_CATEGORY[category]?.[status] ?? ORDER_STATUS_LABEL[status];
}

export interface BaseOrder {
  id: string;
  shopCategory: ShopCategory;
  shopId: string;
  createdAt: string;
  statusUpdatedAt?: string;
  status: OrderStatus;
}

export interface CargoOrder extends BaseOrder {
  shopCategory: "cargo";
  routeId: string;
  routeSnapshot: {
    type: CargoType;
    fromCity: string;
    toCity: string;
    pricePerKg: string;
  };
  item: {
    description: string;
    weight: string;
    dimensions?: string;
    imageDataUrl?: string;
  };
  sender: { name: string; phone: string; address: string };
  receiver: { name: string; phone: string; address: string };
  estimatedPrice: string;
}

export interface RestaurantOrderItem {
  itemId: string;
  category: string;
  name: string;
  price: string;
  qty: number;
}

export interface RestaurantOrder extends BaseOrder {
  shopCategory: "restaurant" | "food";
  items: RestaurantOrderItem[];
  subtotalAmount: number;
  customer: { name: string; phone: string; address: string };
  notes?: string;
}

export interface HospitalAppointment extends BaseOrder {
  shopCategory: "hospital";
  doctorId: string;
  doctorSnapshot: { name: string; department: string };
  preferredDate: string;
  preferredTime: string;
  patient: { name: string; phone: string; age?: string };
  symptom?: string;
}

export interface BeautyAppointment extends BaseOrder {
  shopCategory: "beauty";
  serviceId: string;
  serviceSnapshot: { name: string; durationMin: string; price: string };
  stylistId?: string;
  stylistName?: string;
  preferredDate: string;
  preferredTime: string;
  customer: { name: string; phone: string };
  notes?: string;
}

export interface MeatOrderItem {
  productId: string;
  category: string;
  name: string;
  /** Display string ("22,000₩") so we don't lose currency / unit semantics. */
  price: string;
  unit: string;
  qty: number;
}

/**
 * Meat shop bank-transfer order. Customer picks quantities, sees a
 * total = subtotal + delivery fee, and is shown a bank account string
 * to wire the money to. The order sits in "pending" until the owner
 * marks it received (= they've seen the deposit).
 */
export interface MeatOrder extends BaseOrder {
  shopCategory: "meat";
  items: MeatOrderItem[];
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  /** Snapshot of the bank string at order time so it never changes after the fact. */
  bankAccountSnapshot: string;
  customer: { name: string; phone: string; address: string };
  notes?: string;
}

export type Order =
  | CargoOrder
  | RestaurantOrder
  | HospitalAppointment
  | BeautyAppointment
  | MeatOrder;

// ===================== HTTP helpers =====================

interface OrdersResponse { orders: Order[] }
interface OrderResponse { order: Order }

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

// ===================== Reads =====================

export interface LoadOrdersOptions {
  /** Limit to the current user's own orders. */
  mine?: boolean;
  /** Limit to a single shop's orders (caller must own the shop, or be admin). */
  shopId?: string;
  /** Limit to a single category — admin only on the server. */
  category?: ShopCategory;
  /** Optional status filter (pending / received / …). */
  status?: OrderStatus;
}

/**
 * Generic order list. Pass at least one of {mine, shopId, category};
 * an empty options object falls back to admin-only "all orders".
 */
export async function loadOrders(opts: LoadOrdersOptions = {}): Promise<Order[]> {
  const params = new URLSearchParams();
  if (opts.mine) params.set("mine", "true");
  if (opts.shopId) params.set("shopId", opts.shopId);
  if (opts.category) params.set("category", opts.category);
  if (opts.status) params.set("status", opts.status);
  const qs = params.toString();
  const data = await getJson<OrdersResponse>(`/api/orders${qs ? `?${qs}` : ""}`);
  return data?.orders ?? [];
}

/**
 * Total pending orders across every shop the caller owns. Drives the
 * red "new order" badge on the /biz Захиалга tab. Returns 0 when not
 * signed in (server returns 200 with count=0 there too).
 */
export async function loadBizPendingOrderCount(): Promise<number> {
  const data = await getJson<{ count: number }>("/api/biz/orders/unread");
  return data?.count ?? 0;
}

/** Convenience wrapper used by the /biz orders tabs. */
export async function loadOrdersByShop(
  category: ShopCategory,
  shopId: string,
): Promise<Order[]> {
  void category; // server-side check by shopId is sufficient
  return loadOrders({ shopId });
}

/** Admin-only: fetch every order in a category. */
export async function loadOrdersByCategory(
  shopCategory: ShopCategory,
): Promise<Order[]> {
  return loadOrders({ category: shopCategory });
}

export async function findOrderById(id: string): Promise<Order | null> {
  const data = await getJson<OrderResponse>(`/api/orders/${encodeURIComponent(id)}`);
  return data?.order ?? null;
}

// ===================== Writes =====================

export async function addOrder(order: Order): Promise<Order | null> {
  // The server fills in id/createdAt/customer_user_id and forces
  // status='pending', so we just send the body fields.
  const data = await postJson<OrderResponse>("/api/orders", order);
  return data?.order ?? null;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order | null> {
  // Use a direct fetch (instead of postJson) so we can throw on non-OK
  // responses; otherwise a 403 silently returns null and the dropdown
  // appears to revert with no explanation.
  const res = await fetch(
    `/api/orders/${encodeURIComponent(id)}/status`,
    {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Status update failed: ${res.status} ${detail}`);
  }
  const data = (await res.json()) as OrderResponse;
  return data?.order ?? null;
}

// ===================== Pure helpers (unchanged) =====================

export function newOrderId(): string {
  return `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function estimateCargoPrice(
  weightKg: number,
  pricePerKgStr: string,
): string {
  const pricePerKg = Number(pricePerKgStr.replace(/[^0-9]/g, "")) || 0;
  if (!weightKg || pricePerKg === 0) return "—";
  const total = Math.round(weightKg * pricePerKg);
  return `${total.toLocaleString("ko-KR")}₩`;
}

export function parsePrice(priceStr: string): number {
  return Number(priceStr.replace(/[^0-9]/g, "")) || 0;
}

export function formatPrice(amount: number): string {
  return `${Math.round(amount).toLocaleString("ko-KR")}₩`;
}
