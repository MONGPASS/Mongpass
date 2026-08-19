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
  travel: {
    pending: "Хүсэлт илгээгдсэн",
    received: "Баталгаажсан",
    in_transit: "Бэлтгэгдэж буй",
    delivered: "Дууссан",
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

/**
 * Travel package booking — captured when the customer hits the
 * "Захиалах" CTA on a travel package detail page. The agency owner
 * sees these in /biz Захиалга tab and acts on them by chat/phone.
 */
export interface TravelBooking extends BaseOrder {
  shopCategory: "travel";
  packageId: string;
  packageSnapshot: {
    title: string;
    price?: string;
    duration?: string;
  };
  /** Lead traveler. */
  customer: { name: string; phone: string; email?: string };
  /** Headcount split — drives planning + per-person pricing on the agency side. */
  travelers: { adults: number; children: number };
  /** ISO date string for the customer's desired start date. */
  preferredDate: string;
  /** Dietary / mobility / room-type preferences — free text. */
  notes?: string;
}

export type Order =
  | CargoOrder
  | RestaurantOrder
  | HospitalAppointment
  | BeautyAppointment
  | MeatOrder
  | TravelBooking;

// ===================== HTTP helpers =====================

interface OrdersResponse { orders: Order[] }
interface OrderResponse { order: Order }

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

// ===================== Submit errors =====================

/**
 * Why an order submission failed, in terms the customer can act on.
 * The server sends the code in its JSON body; we fall back to mapping
 * the HTTP status when it doesn't (older deploys, proxy errors).
 */
export type OrderErrorCode =
  | "unauthenticated"
  | "shop_not_found"
  | "shop_not_approved"
  | "shop_closed"
  | "invalid"
  | "network"
  | "unknown";

const ORDER_ERROR_MESSAGE: Record<OrderErrorCode, string> = {
  unauthenticated: "Захиалга өгөхийн тулд нэвтэрнэ үү.",
  shop_not_found: "Дэлгүүр олдсонгүй. Хуудсаа дахин ачаална уу.",
  shop_not_approved:
    "Энэ дэлгүүр баталгаажаагүй тул одоогоор захиалга авах боломжгүй байна.",
  shop_closed:
    "Дэлгүүр одоогоор хаалттай байна. Нээх үед нь дахин оролдоно уу.",
  invalid: "Захиалгын мэдээлэл дутуу байна. Шалгаад дахин илгээнэ үү.",
  network: "Сүлжээнд холбогдож чадсангүй. Дахин оролдоно уу.",
  unknown: "Захиалга илгээхэд алдаа гарлаа. Дахин оролдоно уу.",
};

export class OrderSubmitError extends Error {
  readonly code: OrderErrorCode;
  constructor(code: OrderErrorCode) {
    super(ORDER_ERROR_MESSAGE[code]);
    this.name = "OrderSubmitError";
    this.code = code;
  }
}

/** Map an HTTP status to a code when the body carries no explicit one. */
function codeFromStatus(status: number): OrderErrorCode {
  if (status === 401) return "unauthenticated";
  if (status === 400) return "invalid";
  if (status === 404) return "shop_not_found";
  if (status === 409) return "shop_not_approved";
  return "unknown";
}

function isOrderErrorCode(value: unknown): value is OrderErrorCode {
  return (
    typeof value === "string" && value in ORDER_ERROR_MESSAGE
  );
}

/**
 * Turn anything thrown by `addOrder` into a message safe to show the
 * customer. Unexpected throws collapse to the generic string rather
 * than leaking a stack trace into the UI.
 */
export function orderErrorMessage(err: unknown): string {
  if (err instanceof OrderSubmitError) return err.message;
  return ORDER_ERROR_MESSAGE.unknown;
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
  /** Page size — omit for the legacy 200-row cap. */
  limit?: number;
  /** Keyset cursor from a previous page's `nextCursor`. */
  cursor?: string | null;
}

export interface OrdersPage {
  orders: Order[];
  nextCursor: string | null;
}

/**
 * One keyset page of orders. Pass at least one of {mine, shopId,
 * category}; an empty options object falls back to admin-only
 * "all orders".
 */
export async function loadOrdersPage(
  opts: LoadOrdersOptions = {},
): Promise<OrdersPage> {
  const params = new URLSearchParams();
  if (opts.mine) params.set("mine", "true");
  if (opts.shopId) params.set("shopId", opts.shopId);
  if (opts.category) params.set("category", opts.category);
  if (opts.status) params.set("status", opts.status);
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.cursor) params.set("cursor", opts.cursor);
  const qs = params.toString();
  const data = await getJson<OrdersResponse & { nextCursor?: string | null }>(
    `/api/orders${qs ? `?${qs}` : ""}`,
  );
  return { orders: data?.orders ?? [], nextCursor: data?.nextCursor ?? null };
}

/** Legacy list form — first page only (up to the server's 200 cap). */
export async function loadOrders(opts: LoadOrdersOptions = {}): Promise<Order[]> {
  const { orders } = await loadOrdersPage(opts);
  return orders;
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

/**
 * Submit an order. Throws {@link OrderSubmitError} on every failure so
 * the caller is forced to surface *something* — the previous
 * "return null on error" contract made a failed submit look identical
 * to a no-op, leaving the customer staring at an unchanged form.
 */
export async function addOrder(order: Order): Promise<Order> {
  // The server fills in id/createdAt/customer_user_id and forces
  // status='pending', so we just send the body fields.
  let res: Response;
  try {
    res = await fetch("/api/orders", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
  } catch {
    throw new OrderSubmitError("network");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { code?: unknown }
      | null;
    throw new OrderSubmitError(
      isOrderErrorCode(body?.code) ? body.code : codeFromStatus(res.status),
    );
  }

  const data = (await res.json().catch(() => null)) as OrderResponse | null;
  if (!data?.order) throw new OrderSubmitError("unknown");
  return data.order;
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
