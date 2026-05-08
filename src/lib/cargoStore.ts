/**
 * Cargo route catalog — backed by /api/shops/[id]/cargo-routes.
 * Every function takes a shopId so the routes are scoped per-shop
 * (Phase 4 fix for the global-localStorage demo bug).
 */

export type CargoType = "air" | "express" | "regular";

export interface CargoRoute {
  id: string;
  type: CargoType;
  fromCity: string;
  toCity: string;
  pricePerKg: string;   // free-form string, e.g. "8,000₩"
  transitDays: string;  // free-form string, e.g. "5-7 хоног"
  schedule?: string;    // optional, e.g. "Лхагва, Бямба"
}

export const CARGO_TYPE_LABEL: Record<CargoType, string> = {
  air: "Агаарын ачаа",
  express: "Экспресс ачаа",
  regular: "Энгийн ачаа",
};

// ===================== HTTP helpers =====================

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

async function patchJson<T>(url: string, body: unknown): Promise<T | null> {
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function del(url: string): Promise<boolean> {
  const res = await fetch(url, { method: "DELETE", credentials: "same-origin" });
  return res.ok;
}

// ===================== API =====================

export async function loadRoutes(shopId: string): Promise<CargoRoute[]> {
  const data = await getJson<{ routes: CargoRoute[] }>(
    `/api/shops/${encodeURIComponent(shopId)}/cargo-routes`,
  );
  return data?.routes ?? [];
}

export async function createRoute(
  shopId: string,
  route: Omit<CargoRoute, "id">,
): Promise<CargoRoute | null> {
  const data = await postJson<{ route: CargoRoute }>(
    `/api/shops/${encodeURIComponent(shopId)}/cargo-routes`,
    route,
  );
  return data?.route ?? null;
}

export async function updateRoute(
  shopId: string,
  routeId: string,
  patch: Partial<Omit<CargoRoute, "id">>,
): Promise<CargoRoute | null> {
  const data = await patchJson<{ route: CargoRoute }>(
    `/api/shops/${encodeURIComponent(shopId)}/cargo-routes/${encodeURIComponent(routeId)}`,
    patch,
  );
  return data?.route ?? null;
}

export async function deleteRoute(shopId: string, routeId: string): Promise<boolean> {
  return del(
    `/api/shops/${encodeURIComponent(shopId)}/cargo-routes/${encodeURIComponent(routeId)}`,
  );
}
