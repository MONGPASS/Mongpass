/**
 * Home page hero banner content — backed by /api/banners (D1, admin-
 * editable). Falls back to a small default set when the table is
 * empty so a freshly-seeded production never looks barren.
 *
 * Each banner pairs a Tailwind gradient with optional uploaded
 * imagery (R2 key). The gradient is a fallback for rows without an
 * uploaded photo and for the live-edit preview before the client
 * uploads.
 */

export interface Banner {
  id: string;
  badge: string;
  title: string;
  desc: string;
  gradient: BannerGradient;
  /**
   * R2 object key when present (e.g. "banner/<rand>.webp"). Render
   * via r2Url(); legacy data URLs / external URLs also pass through
   * unchanged.
   */
  imageR2Key?: string;
  /**
   * Optional click target. Internal app routes start with "/" (use
   * Next.js Link), external links start with "http(s)://" (open in
   * a new tab). Anything else is rejected server-side to avoid
   * `javascript:` and other unsafe schemes.
   */
  linkUrl?: string;
}

export type BannerGradient =
  | "blue"
  | "purple"
  | "orange"
  | "emerald"
  | "pink"
  | "slate";

export const BANNER_GRADIENTS: Record<BannerGradient, { from: string; to: string; label: string }> = {
  blue: { from: "from-blue-600", to: "to-indigo-800", label: "Хөх" },
  purple: { from: "from-purple-500", to: "to-fuchsia-700", label: "Ягаан" },
  orange: { from: "from-orange-400", to: "to-red-500", label: "Улбар" },
  emerald: { from: "from-emerald-500", to: "to-teal-700", label: "Ногоон" },
  pink: { from: "from-pink-500", to: "to-rose-600", label: "Ягаан-улаан" },
  slate: { from: "from-slate-700", to: "to-slate-900", label: "Хар" },
};

export const defaultBanners: Banner[] = [
  {
    id: "seed-1",
    badge: "20% Хямдрал",
    title: "Улаанбаатар руу ачаа тээвэр",
    desc: "Баталгаат карго үйлчилгээ",
    gradient: "blue",
  },
  {
    id: "seed-2",
    badge: "Шинэ",
    title: "Онлайн эмнэлгийн цаг авалт",
    desc: "Хүлээгдэлгүй үйлчилгээ",
    gradient: "purple",
  },
  {
    id: "seed-3",
    badge: "Онцлох",
    title: "Хямд нислэгүүд",
    desc: "Солонгос - Монгол чиглэл",
    gradient: "orange",
  },
];

export async function loadBanners(): Promise<Banner[]> {
  try {
    const res = await fetch("/api/banners", { credentials: "same-origin" });
    if (!res.ok) return defaultBanners;
    const data = (await res.json()) as { banners?: Banner[] };
    const list = data.banners ?? [];
    // Empty table → show seeds. The admin page's first save replaces
    // the seeds with whatever was authored.
    return list.length > 0 ? list : defaultBanners;
  } catch {
    return defaultBanners;
  }
}

/**
 * Replace the full banner list. Admin-only on the server side. Returns
 * the persisted list (with any server-assigned ids) so the caller can
 * sync state — or null on failure.
 */
export async function saveBanners(banners: Banner[]): Promise<Banner[] | null> {
  try {
    const res = await fetch("/api/banners", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banners }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { banners?: Banner[] };
    return data.banners ?? null;
  } catch {
    return null;
  }
}

export function newBannerId(): string {
  return `banner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
