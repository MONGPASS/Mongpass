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

/**
 * Per-category label overrides. Each category uses its own vocabulary:
 *  - cargo:       request → received → in transit → delivered
 *  - restaurant:  request → confirmed → preparing → delivered
 *  - hospital:    request → confirmed → ─ → completed   (no in-transit phase)
 *  - beauty:      request → confirmed → ─ → completed
 */
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
};

const APPOINTMENT_FLOW: OrderStatus[] = ["pending", "received", "delivered"];

/**
 * Returns the active workflow stages for this category.
 * Cargo and restaurant use the full 4-step flow; appointments
 * (hospital, beauty) skip in_transit.
 */
export function getStatusFlow(category: ShopCategory): OrderStatus[] {
  if (category === "hospital" || category === "beauty") return APPOINTMENT_FLOW;
  return ORDER_STATUS_FLOW;
}

/** Returns the user-facing label for a status in this category. */
export function getStatusLabel(category: ShopCategory, status: OrderStatus): string {
  return STATUS_LABEL_BY_CATEGORY[category]?.[status] ?? ORDER_STATUS_LABEL[status];
}

export interface BaseOrder {
  id: string;
  shopCategory: ShopCategory;
  shopId: string;
  createdAt: string;   // ISO date — when the customer placed the order
  /**
   * ISO date — set whenever the order's status changes. Used to drive
   * notification freshness so customers see a fresh "your order is now
   * confirmed" alert even after they've already read the initial
   * "order placed" notification. Falls back to createdAt for older
   * records that pre-date this field.
   */
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
    imageDataUrl?: string;  // base64 data URL of user-uploaded photo
  };
  sender: {
    name: string;
    phone: string;
    address: string;
  };
  receiver: {
    name: string;
    phone: string;
    address: string;
  };
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
  subtotalAmount: number;   // numeric, in ₩
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  notes?: string;
}

export interface HospitalAppointment extends BaseOrder {
  shopCategory: "hospital";
  doctorId: string;
  doctorSnapshot: {
    name: string;
    department: string;
  };
  preferredDate: string;   // user-entered free text (e.g. "2026.05.10")
  preferredTime: string;   // e.g. "10:30"
  patient: {
    name: string;
    phone: string;
    age?: string;
  };
  symptom?: string;
}

export interface BeautyAppointment extends BaseOrder {
  shopCategory: "beauty";
  serviceId: string;
  serviceSnapshot: {
    name: string;
    durationMin: string;
    price: string;
  };
  stylistId?: string;
  stylistName?: string;
  preferredDate: string;
  preferredTime: string;
  customer: {
    name: string;
    phone: string;
  };
  notes?: string;
}

export type Order = CargoOrder | RestaurantOrder | HospitalAppointment | BeautyAppointment;

const STORAGE_KEY = "mongpass:orders:v1";

export function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function addOrder(order: Order): void {
  const all = loadOrders();
  saveOrders([order, ...all]);
}

export function updateOrderStatus(id: string, status: OrderStatus): void {
  const all = loadOrders();
  const now = new Date().toISOString();
  saveOrders(
    all.map((o) => (o.id === id ? { ...o, status, statusUpdatedAt: now } : o)),
  );
}

export function loadOrdersByShop(shopCategory: ShopCategory, shopId: string): Order[] {
  return loadOrders().filter(
    (o) => o.shopCategory === shopCategory && o.shopId === shopId,
  );
}

export function loadOrdersByCategory(shopCategory: ShopCategory): Order[] {
  return loadOrders().filter((o) => o.shopCategory === shopCategory);
}

export function newOrderId(): string {
  return `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Estimate price for a cargo order: weight × pricePerKg.
 * pricePerKg is stored as a user-entered string (e.g. "8,500₩"),
 * so this strips non-digits, multiplies, and re-formats.
 */
export function estimateCargoPrice(
  weightKg: number,
  pricePerKgStr: string,
): string {
  const pricePerKg = Number(pricePerKgStr.replace(/[^0-9]/g, "")) || 0;
  if (!weightKg || pricePerKg === 0) return "—";
  const total = Math.round(weightKg * pricePerKg);
  return `${total.toLocaleString("ko-KR")}₩`;
}

/**
 * Numeric form of estimateCargoPrice — useful for math (e.g. building
 * a breakdown). Returns 0 when inputs are invalid.
 */
export function parsePrice(priceStr: string): number {
  return Number(priceStr.replace(/[^0-9]/g, "")) || 0;
}

export function formatPrice(amount: number): string {
  return `${Math.round(amount).toLocaleString("ko-KR")}₩`;
}
