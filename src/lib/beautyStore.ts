/**
 * Per-shop beauty services + stylists — backed by
 * /api/shops/[id]/beauty-services and /api/shops/[id]/beauty-stylists.
 */

export interface BeautyService {
  id: string;
  name: string;
  category: string;
  durationMin: string;   // free-form string (server stores as INT)
  price: string;
}

export interface Stylist {
  id: string;
  name: string;
  specialty?: string;
  imageDataUrl?: string;
}

export const BEAUTY_SERVICE_CATEGORIES = [
  "Үс засалт",
  "Үс будах",
  "Маникюр",
  "Педикюр",
  "Нүүрний арчилгаа",
  "Бусад",
];

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

// ----- Services -----

export async function loadServices(shopId: string): Promise<BeautyService[]> {
  const data = await getJson<{ services: BeautyService[] }>(
    `/api/shops/${encodeURIComponent(shopId)}/beauty-services`,
  );
  return data?.services ?? [];
}

export async function createService(
  shopId: string,
  service: Omit<BeautyService, "id">,
): Promise<BeautyService | null> {
  const data = await postJson<{ service: BeautyService }>(
    `/api/shops/${encodeURIComponent(shopId)}/beauty-services`,
    service,
  );
  return data?.service ?? null;
}

export async function updateService(
  shopId: string,
  serviceId: string,
  patch: Partial<Omit<BeautyService, "id">>,
): Promise<BeautyService | null> {
  const data = await patchJson<{ service: BeautyService }>(
    `/api/shops/${encodeURIComponent(shopId)}/beauty-services/${encodeURIComponent(serviceId)}`,
    patch,
  );
  return data?.service ?? null;
}

export async function deleteService(shopId: string, serviceId: string): Promise<boolean> {
  return del(
    `/api/shops/${encodeURIComponent(shopId)}/beauty-services/${encodeURIComponent(serviceId)}`,
  );
}

// ----- Stylists -----

export async function loadStylists(shopId: string): Promise<Stylist[]> {
  const data = await getJson<{ stylists: Stylist[] }>(
    `/api/shops/${encodeURIComponent(shopId)}/beauty-stylists`,
  );
  return data?.stylists ?? [];
}

export async function createStylist(
  shopId: string,
  stylist: Omit<Stylist, "id">,
): Promise<Stylist | null> {
  const data = await postJson<{ stylist: Stylist }>(
    `/api/shops/${encodeURIComponent(shopId)}/beauty-stylists`,
    stylist,
  );
  return data?.stylist ?? null;
}

export async function updateStylist(
  shopId: string,
  stylistId: string,
  patch: Partial<Omit<Stylist, "id">>,
): Promise<Stylist | null> {
  const data = await patchJson<{ stylist: Stylist }>(
    `/api/shops/${encodeURIComponent(shopId)}/beauty-stylists/${encodeURIComponent(stylistId)}`,
    patch,
  );
  return data?.stylist ?? null;
}

export async function deleteStylist(shopId: string, stylistId: string): Promise<boolean> {
  return del(
    `/api/shops/${encodeURIComponent(shopId)}/beauty-stylists/${encodeURIComponent(stylistId)}`,
  );
}
