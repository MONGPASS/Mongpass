export type CargoType = "air" | "express" | "regular";

export interface CargoRoute {
  id: string;
  type: CargoType;
  fromCity: string;
  toCity: string;
  pricePerKg: string;   // e.g. "8,000₩"
  transitDays: string;  // e.g. "5-7 хоног"
  schedule: string;     // e.g. "Лхагва, Бямба"
}

const STORAGE_KEY = "mongpass:cargo:routes:v3";

export const CARGO_TYPE_LABEL: Record<CargoType, string> = {
  air: "Агаарын ачаа",
  express: "Экспресс ачаа",
  regular: "Энгийн ачаа",
};

export const defaultRoutes: CargoRoute[] = [
  {
    id: "seed-1",
    type: "air",
    fromCity: "Сөүл",
    toCity: "Улаанбаатар",
    pricePerKg: "8,500₩",
    transitDays: "5-7 хоног",
    schedule: "Лхагва, Бямба",
  },
  {
    id: "seed-2",
    type: "express",
    fromCity: "Сөүл",
    toCity: "Улаанбаатар",
    pricePerKg: "5,500₩",
    transitDays: "10-14 хоног",
    schedule: "Долоо хоног бүр",
  },
  {
    id: "seed-3",
    type: "regular",
    fromCity: "Бусан",
    toCity: "Улаанбаатар",
    pricePerKg: "2,800₩",
    transitDays: "30-45 хоног",
    schedule: "Сар бүр",
  },
];

export function loadRoutes(): CargoRoute[] {
  if (typeof window === "undefined") return defaultRoutes;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultRoutes;
    const parsed = JSON.parse(raw) as CargoRoute[];
    return Array.isArray(parsed) ? parsed : defaultRoutes;
  } catch {
    return defaultRoutes;
  }
}

export function saveRoutes(routes: CargoRoute[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
}

export function newId(): string {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
