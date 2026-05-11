/**
 * Travel package store — backed by /api/shops/[id]/travel-packages.
 * Mirrors carListingStore's shape (ad-style payload, own gallery,
 * structured body) — kept separate because the field set + accordion
 * itinerary are travel-specific.
 */

export interface TravelPackageDay {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
}

export interface TravelPackage {
  id: string;
  shopId: string;
  title: string;
  price?: string;
  description?: string;
  // Quick-facts strip
  duration?: string;
  groupSize?: string;
  transport?: string;
  accommodation?: string;
  guide?: string;
  tourType?: string;
  // Checklists
  included: string[];
  excluded: string[];
  status: "available" | "sold_out";
  images: string[];
  days: TravelPackageDay[];
  createdAt: string;
}

export type TravelPackageInput = Omit<
  TravelPackage,
  "id" | "shopId" | "createdAt" | "status" | "days"
> & {
  // Day input shape — id is optional (server mints one for new days).
  days: Array<Omit<TravelPackageDay, "id"> & { id?: string }>;
};

export const emptyTravelPackage: TravelPackageInput = {
  title: "",
  price: "",
  description: "",
  duration: "",
  groupSize: "",
  transport: "",
  accommodation: "",
  guide: "",
  tourType: "",
  included: [],
  excluded: [],
  images: [],
  days: [],
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

export async function loadTravelPackages(
  shopId: string,
): Promise<TravelPackage[]> {
  const data = await getJson<{ packages: TravelPackage[] }>(
    `/api/shops/${encodeURIComponent(shopId)}/travel-packages`,
  );
  return data?.packages ?? [];
}

export async function findTravelPackage(
  shopId: string,
  packageId: string,
): Promise<TravelPackage | null> {
  const data = await getJson<{ package: TravelPackage }>(
    `/api/shops/${encodeURIComponent(shopId)}/travel-packages/${encodeURIComponent(packageId)}`,
  );
  return data?.package ?? null;
}

export async function createTravelPackage(
  shopId: string,
  input: TravelPackageInput,
): Promise<TravelPackage | null> {
  const data = await postJson<{ package: TravelPackage }>(
    `/api/shops/${encodeURIComponent(shopId)}/travel-packages`,
    input,
  );
  return data?.package ?? null;
}

export async function updateTravelPackage(
  shopId: string,
  packageId: string,
  patch: Partial<TravelPackageInput> & { status?: "available" | "sold_out" },
): Promise<TravelPackage | null> {
  const data = await patchJson<{ package: TravelPackage }>(
    `/api/shops/${encodeURIComponent(shopId)}/travel-packages/${encodeURIComponent(packageId)}`,
    patch,
  );
  return data?.package ?? null;
}

export async function deleteTravelPackage(
  shopId: string,
  packageId: string,
): Promise<boolean> {
  return del(
    `/api/shops/${encodeURIComponent(shopId)}/travel-packages/${encodeURIComponent(packageId)}`,
  );
}
