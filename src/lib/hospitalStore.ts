/** Per-shop hospital doctors — backed by /api/shops/[id]/doctors. */

export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialty?: string;
  bio?: string;
  /**
   * R2 object key for the doctor's portrait (e.g. "doctor/<rand>.webp").
   * Render through `r2Url()` to get a same-origin <img> src. PATCH
   * accepts null to clear; reads always normalise to undefined.
   */
  imageR2Key?: string;
}

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

export async function loadDoctors(shopId: string): Promise<Doctor[]> {
  const data = await getJson<{ doctors: Doctor[] }>(
    `/api/shops/${encodeURIComponent(shopId)}/doctors`,
  );
  return data?.doctors ?? [];
}

export async function createDoctor(
  shopId: string,
  doctor: Omit<Doctor, "id">,
): Promise<Doctor | null> {
  const data = await postJson<{ doctor: Doctor }>(
    `/api/shops/${encodeURIComponent(shopId)}/doctors`,
    doctor,
  );
  return data?.doctor ?? null;
}

export async function updateDoctor(
  shopId: string,
  doctorId: string,
  patch: Partial<Omit<Doctor, "id" | "imageR2Key">> & {
    /** null clears the portrait; undefined leaves it unchanged. */
    imageR2Key?: string | null;
  },
): Promise<Doctor | null> {
  const data = await patchJson<{ doctor: Doctor }>(
    `/api/shops/${encodeURIComponent(shopId)}/doctors/${encodeURIComponent(doctorId)}`,
    patch,
  );
  return data?.doctor ?? null;
}

export async function deleteDoctor(shopId: string, doctorId: string): Promise<boolean> {
  return del(
    `/api/shops/${encodeURIComponent(shopId)}/doctors/${encodeURIComponent(doctorId)}`,
  );
}
