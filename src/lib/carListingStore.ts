/**
 * Used-car listings store — backed by /api/shops/[id]/car-listings
 * (D1). A listing is a richer "ad" than the generic product rows
 * the other categories use (own gallery, spec table, lifecycle
 * status), so it lives in its own table and has its own store.
 */

export interface CarListing {
  id: string;
  shopId: string;
  /**
   * Composed display title (e.g. "Toyota Corolla Fielder"). Derived
   * from brand + model on the write path so older code referencing
   * `title` keeps working; new code should prefer `brand` + `model`.
   */
  title: string;
  brand?: string;
  model?: string;
  price?: string;
  description?: string;
  location?: string;
  // Spec table — all free text; the form constrains values via
  // dropdowns but storage stays open-ended.
  engineCapacity?: string;
  transmission?: string;
  steering?: string;
  bodyType?: string;
  exteriorColor?: string;
  yearManufactured?: string;
  engineType?: string;
  interiorColor?: string;
  drive?: string;
  mileage?: string;
  doors?: string;
  status: "available" | "sold";
  /** R2 keys for every photo, in display order. */
  images: string[];
  createdAt: string;
}

/**
 * Empty defaults for the create form. Keeping this out of the
 * component makes it trivial to clear after submit.
 */
export const emptyCarListing: Omit<CarListing, "id" | "shopId" | "createdAt" | "status" | "title"> = {
  brand: "",
  model: "",
  price: "",
  description: "",
  location: "",
  engineCapacity: "",
  transmission: "",
  steering: "",
  bodyType: "",
  exteriorColor: "",
  yearManufactured: "",
  engineType: "",
  interiorColor: "",
  drive: "",
  mileage: "",
  doors: "",
  images: [],
};

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

export async function loadCarListings(shopId: string): Promise<CarListing[]> {
  const data = await getJson<{ listings: CarListing[] }>(
    `/api/shops/${encodeURIComponent(shopId)}/car-listings`,
  );
  return data?.listings ?? [];
}

export async function findCarListing(
  shopId: string,
  listingId: string,
): Promise<CarListing | null> {
  const data = await getJson<{ listing: CarListing }>(
    `/api/shops/${encodeURIComponent(shopId)}/car-listings/${encodeURIComponent(listingId)}`,
  );
  return data?.listing ?? null;
}

export async function createCarListing(
  shopId: string,
  // Title is composed server-side from brand + model, so callers
  // never need to send it.
  input: Omit<CarListing, "id" | "shopId" | "createdAt" | "status" | "title">,
): Promise<CarListing | null> {
  const data = await postJson<{ listing: CarListing }>(
    `/api/shops/${encodeURIComponent(shopId)}/car-listings`,
    input,
  );
  return data?.listing ?? null;
}

export async function updateCarListing(
  shopId: string,
  listingId: string,
  patch: Partial<Omit<CarListing, "id" | "shopId" | "createdAt">>,
): Promise<CarListing | null> {
  const data = await patchJson<{ listing: CarListing }>(
    `/api/shops/${encodeURIComponent(shopId)}/car-listings/${encodeURIComponent(listingId)}`,
    patch,
  );
  return data?.listing ?? null;
}

export async function deleteCarListing(
  shopId: string,
  listingId: string,
): Promise<boolean> {
  return del(
    `/api/shops/${encodeURIComponent(shopId)}/car-listings/${encodeURIComponent(listingId)}`,
  );
}
