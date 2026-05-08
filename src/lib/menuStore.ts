/**
 * Restaurant menu items — backed by /api/shops/[id]/menu.
 * Each item is per-shop (Phase 4). The grouping into MenuCategory
 * happens client-side from the flat list returned by the API.
 */

export interface MenuItem {
  id: string;
  category: string;
  name: string;
  desc: string;
  price: string;
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
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

export async function loadMenuItems(shopId: string): Promise<MenuItem[]> {
  const data = await getJson<{ items: MenuItem[] }>(
    `/api/shops/${encodeURIComponent(shopId)}/menu`,
  );
  return data?.items ?? [];
}

export async function loadMenu(shopId: string): Promise<MenuCategory[]> {
  return groupItems(await loadMenuItems(shopId));
}

export async function createMenuItem(
  shopId: string,
  item: Omit<MenuItem, "id">,
): Promise<MenuItem | null> {
  const data = await postJson<{ item: MenuItem }>(
    `/api/shops/${encodeURIComponent(shopId)}/menu`,
    item,
  );
  return data?.item ?? null;
}

export async function updateMenuItem(
  shopId: string,
  itemId: string,
  patch: Partial<Omit<MenuItem, "id">>,
): Promise<MenuItem | null> {
  const data = await patchJson<{ item: MenuItem }>(
    `/api/shops/${encodeURIComponent(shopId)}/menu/${encodeURIComponent(itemId)}`,
    patch,
  );
  return data?.item ?? null;
}

export async function deleteMenuItem(shopId: string, itemId: string): Promise<boolean> {
  return del(
    `/api/shops/${encodeURIComponent(shopId)}/menu/${encodeURIComponent(itemId)}`,
  );
}

export function flattenItems(menu: MenuCategory[]): MenuItem[] {
  return menu.flatMap((c) => c.items.map((i) => ({ ...i, category: c.category })));
}

export function groupItems(items: MenuItem[]): MenuCategory[] {
  const map = new Map<string, MenuItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}
