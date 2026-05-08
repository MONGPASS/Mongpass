/**
 * Review store — backed by /api/reviews. Reads land in D1 so a review
 * left on phone shows up on desktop. Aggregate rating + count for a
 * shop arrive on the Shop record itself (`reviewCount`, `avgRating`)
 * via a SQL subquery in hydrateShops, so the category list never has
 * to do N+1 review fetches.
 */

export interface Review {
  id: string;
  shopId: string;
  userId: string | null;     // null when reviewer is anonymous (legacy rows)
  userName: string;          // snapshot — survives if user renames
  rating: number;            // 1–5
  comment: string;
  createdAt: string;
}

export interface ReviewSummary {
  count: number;
  average: number;     // rounded to 1 decimal, 0 when count === 0
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

export async function loadReviewsForShop(shopId: string): Promise<Review[]> {
  const data = await getJson<{ reviews: Review[] }>(
    `/api/reviews?shopId=${encodeURIComponent(shopId)}`,
  );
  return data?.reviews ?? [];
}

export async function addReview(input: {
  shopId: string;
  rating: number;
  comment: string;
}): Promise<Review | null> {
  const data = await postJson<{ review: Review }>("/api/reviews", input);
  return data?.review ?? null;
}

/**
 * Pure helper — given a list of reviews already loaded for a shop,
 * compute count + average. Kept synchronous so consumers that already
 * fetched the list (e.g. the Сэтгэгдэл tab) don't re-fetch.
 */
export function summarizeReviews(reviews: Review[]): ReviewSummary {
  if (reviews.length === 0) return { count: 0, average: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    count: reviews.length,
    average: Math.round((sum / reviews.length) * 10) / 10,
  };
}

/** Pure helper — does this user already appear in the review list? */
export function userHasReviewed(
  reviews: Review[],
  userId: string | null,
): boolean {
  if (!userId) return false;
  return reviews.some((r) => r.userId === userId);
}
