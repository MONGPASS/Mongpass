/**
 * Editorial news categories. Admin picks one from this list when
 * publishing; customer-facing /news page exposes them as a filter
 * tab strip. Kept short (8 buckets) so the strip stays scannable
 * without horizontal scroll on most phones.
 *
 * Stored as a plain TEXT column on news_articles — we don't enforce
 * the enum in SQL so adding a new bucket is a one-line constant
 * change and existing rows under retired buckets keep rendering
 * (they just fall outside the new tabs).
 */

export const NEWS_CATEGORIES = [
  "Онцлох",
  "Бизнес",
  "Аялал",
  "Виз / Бичиг баримт",
  "Эрүүл мэнд",
  "Боловсрол",
  "Үйл явдал",
  "Бусад",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

/** Tailwind classes per category for the badge / chip rendering. */
export const NEWS_CATEGORY_BADGE: Record<string, string> = {
  "Онцлох":              "bg-amber-100 text-amber-700",
  "Бизнес":              "bg-blue-100 text-blue-700",
  "Аялал":               "bg-cyan-100 text-cyan-700",
  "Виз / Бичиг баримт":  "bg-purple-100 text-purple-700",
  "Эрүүл мэнд":          "bg-emerald-100 text-emerald-700",
  "Боловсрол":           "bg-indigo-100 text-indigo-700",
  "Үйл явдал":           "bg-pink-100 text-pink-700",
  "Бусад":               "bg-gray-100 text-gray-700",
};

export function newsCategoryBadge(category: string | undefined): string {
  if (!category) return NEWS_CATEGORY_BADGE.Бусад;
  return NEWS_CATEGORY_BADGE[category] ?? NEWS_CATEGORY_BADGE.Бусад;
}
