/** Per-shop meat shop products — backed by /api/shops/[id]/meat-products. */

export interface MeatProduct {
  id: string;
  category: string;
  name: string;
  description: string;
  price: string;
  unit: string;            // e.g. "1кг"
  /**
   * R2 object key (e.g. "meat/<shop>/<rand>.webp"). Render through
   * `r2Url()` to get a same-origin <img> src. `null` is allowed in
   * PATCH bodies to mean "clear the image"; reads always normalise
   * to undefined.
   */
  imageR2Key?: string;
}

export const MEAT_PRODUCT_CATEGORIES = [
  "Үхрийн мах",
  "Хонины мах",
  "Гахайн мах",
  "Тахианы мах",
  "Бусад хүнс",
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

export async function loadMeatProducts(shopId: string): Promise<MeatProduct[]> {
  const data = await getJson<{ products: MeatProduct[] }>(
    `/api/shops/${encodeURIComponent(shopId)}/meat-products`,
  );
  return data?.products ?? [];
}

export async function createMeatProduct(
  shopId: string,
  product: Omit<MeatProduct, "id">,
): Promise<MeatProduct | null> {
  const data = await postJson<{ product: MeatProduct }>(
    `/api/shops/${encodeURIComponent(shopId)}/meat-products`,
    product,
  );
  return data?.product ?? null;
}

export async function updateMeatProduct(
  shopId: string,
  productId: string,
  patch: Partial<Omit<MeatProduct, "id" | "imageR2Key">> & {
    /** null = clear the image, undefined = leave unchanged. */
    imageR2Key?: string | null;
  },
): Promise<MeatProduct | null> {
  const data = await patchJson<{ product: MeatProduct }>(
    `/api/shops/${encodeURIComponent(shopId)}/meat-products/${encodeURIComponent(productId)}`,
    patch,
  );
  return data?.product ?? null;
}

export async function deleteMeatProduct(shopId: string, productId: string): Promise<boolean> {
  return del(
    `/api/shops/${encodeURIComponent(shopId)}/meat-products/${encodeURIComponent(productId)}`,
  );
}
