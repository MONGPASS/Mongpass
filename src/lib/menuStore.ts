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

const STORAGE_KEY = "mongpass:restaurant:menu";

export const defaultMenu: MenuCategory[] = [
  {
    category: "Гол хоол",
    items: [
      { id: "seed-1", category: "Гол хоол", name: "Хуушуур (3ш)", desc: "Үхрийн махтай шаржигнуур хуушуур", price: "12,000₩" },
      { id: "seed-2", category: "Гол хоол", name: "Бууз (5ш)", desc: "Амтат шүүслэг бууз", price: "10,000₩" },
      { id: "seed-3", category: "Гол хоол", name: "Цуйван", desc: "Гараар элдсэн гурилтай цуйван", price: "14,000₩" },
    ],
  },
  {
    category: "Шөл",
    items: [
      { id: "seed-4", category: "Шөл", name: "Банштай цай", desc: "Борцтой, сүүтэй банштай цай", price: "15,000₩" },
    ],
  },
];

export function loadMenu(): MenuCategory[] {
  if (typeof window === "undefined") return defaultMenu;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMenu;
    const parsed = JSON.parse(raw) as MenuCategory[];
    return Array.isArray(parsed) ? parsed : defaultMenu;
  } catch {
    return defaultMenu;
  }
}

export function saveMenu(menu: MenuCategory[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(menu));
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

export function newId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
