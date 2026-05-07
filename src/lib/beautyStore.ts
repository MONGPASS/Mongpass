export interface BeautyService {
  id: string;
  name: string;
  category: string;        // e.g. "Үс засалт"
  durationMin: string;     // e.g. "30"
  price: string;           // e.g. "15,000₩"
}

export interface Stylist {
  id: string;
  name: string;
  specialty?: string;
  imageDataUrl?: string;
}

const SERVICES_KEY = "mongpass:beauty:services:v1";
const STYLISTS_KEY = "mongpass:beauty:stylists:v1";

export const BEAUTY_SERVICE_CATEGORIES = [
  "Үс засалт",
  "Үс будах",
  "Маникюр",
  "Педикюр",
  "Нүүрний арчилгаа",
  "Бусад",
];

export const defaultServices: BeautyService[] = [
  { id: "svc-seed-1", name: "Эрэгтэй үс засах", category: "Үс засалт", durationMin: "30", price: "15,000₩" },
  { id: "svc-seed-2", name: "Эмэгтэй үс засах", category: "Үс засалт", durationMin: "45", price: "20,000₩" },
  { id: "svc-seed-3", name: "Үс будах", category: "Үс будах", durationMin: "120", price: "60,000₩" },
];

export const defaultStylists: Stylist[] = [
  { id: "sty-seed-1", name: "Амараа", specialty: "Үс засалт, будах" },
  { id: "sty-seed-2", name: "Сараа", specialty: "Маникюр, педикюр" },
  { id: "sty-seed-3", name: "Болдоо", specialty: "Үс засалт" },
];

function load<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function loadServices(): BeautyService[] { return load(SERVICES_KEY, defaultServices); }
export function saveServices(s: BeautyService[]): void { save(SERVICES_KEY, s); }
export function loadStylists(): Stylist[] { return load(STYLISTS_KEY, defaultStylists); }
export function saveStylists(s: Stylist[]): void { save(STYLISTS_KEY, s); }

export function newServiceId(): string {
  return `svc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
export function newStylistId(): string {
  return `sty-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
