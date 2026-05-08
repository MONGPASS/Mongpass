/**
 * Home page hero banner content. Fully admin-editable; falls back to a
 * sensible default set so the home page never looks empty.
 *
 * Each banner uses a Tailwind gradient pair (from/to) chosen from a
 * small palette to keep the visual consistent without letting admins
 * paste arbitrary colors.
 */

export interface Banner {
  id: string;
  badge: string;
  title: string;
  desc: string;
  /** One of the keys in BANNER_GRADIENTS — controls fallback colour scheme. */
  gradient: BannerGradient;
  /**
   * Optional uploaded background image. When present, the banner
   * renders this image (with a dark gradient overlay for legibility)
   * instead of the flat gradient colour scheme. base64 data URL for
   * now; Phase 5 / Phase 7 will swap to an R2 object key.
   */
  imageDataUrl?: string;
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

const STORAGE_KEY = "mongpass:banners:v1";

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

export function loadBanners(): Banner[] {
  if (typeof window === "undefined") return defaultBanners;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultBanners;
    const parsed = JSON.parse(raw) as Banner[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultBanners;
  } catch {
    return defaultBanners;
  }
}

export function saveBanners(banners: Banner[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
}

export function newBannerId(): string {
  return `banner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
