/**
 * Meat shop product catalogue. Mirrors `menuStore` but with categories
 * specific to meat shops (Үхрийн мах, Хонины мах, etc) and weight-based
 * pricing in mind.
 *
 * For the demo this is a single shared store (one meat shop). When we
 * move to multi-tenant, we'll key entries by shopId.
 */

export interface MeatProduct {
  id: string;
  category: string;          // e.g. "Үхрийн мах"
  name: string;
  description: string;
  price: string;             // e.g. "22,000₩"
  unit: string;              // e.g. "1кг" — displayed alongside price
  imageDataUrl?: string;
}

const STORAGE_KEY = "mongpass:meat:products:v1";

export const MEAT_PRODUCT_CATEGORIES = [
  "Үхрийн мах",
  "Хонины мах",
  "Гахайн мах",
  "Тахианы мах",
  "Бусад хүнс",
];

export const defaultMeatProducts: MeatProduct[] = [
  {
    id: "meat-seed-1",
    category: "Үхрийн мах",
    name: "Үхрийн цул мах",
    description: "Шинэ, ясгүй цул мах",
    price: "22,000₩",
    unit: "1кг",
  },
  {
    id: "meat-seed-2",
    category: "Үхрийн мах",
    name: "Үхрийн ястай мах",
    description: "Шөлний ястай",
    price: "18,500₩",
    unit: "1кг",
  },
];

export function loadMeatProducts(): MeatProduct[] {
  if (typeof window === "undefined") return defaultMeatProducts;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMeatProducts;
    const parsed = JSON.parse(raw) as MeatProduct[];
    return Array.isArray(parsed) ? parsed : defaultMeatProducts;
  } catch {
    return defaultMeatProducts;
  }
}

export function saveMeatProducts(products: MeatProduct[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function newMeatProductId(): string {
  return `meat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
