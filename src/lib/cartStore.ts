import { parsePrice } from "@/lib/orderStore";

export interface CartItem {
  itemId: string;        // menu item id
  category: string;
  name: string;
  price: string;         // e.g. "12,000₩"
  qty: number;
}

const KEY_PREFIX = "mongpass:cart:";

function key(shopId: string): string {
  return `${KEY_PREFIX}${shopId}`;
}

export function loadCart(shopId: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(shopId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(shopId: string, items: CartItem[]): void {
  if (typeof window === "undefined") return;
  if (items.length === 0) {
    window.localStorage.removeItem(key(shopId));
  } else {
    window.localStorage.setItem(key(shopId), JSON.stringify(items));
  }
}

export function addToCart(shopId: string, incoming: Omit<CartItem, "qty">): CartItem[] {
  const cart = loadCart(shopId);
  const existing = cart.find((c) => c.itemId === incoming.itemId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...incoming, qty: 1 });
  }
  saveCart(shopId, cart);
  return cart;
}

export function updateQty(shopId: string, itemId: string, qty: number): CartItem[] {
  const cart = loadCart(shopId);
  const next = qty <= 0
    ? cart.filter((c) => c.itemId !== itemId)
    : cart.map((c) => (c.itemId === itemId ? { ...c, qty } : c));
  saveCart(shopId, next);
  return next;
}

export function clearCart(shopId: string): void {
  saveCart(shopId, []);
}

export function cartTotalCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + parsePrice(i.price) * i.qty, 0);
}
