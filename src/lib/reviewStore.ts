export interface Review {
  id: string;
  shopId: string;
  userId: string | null;     // null when reviewer is anonymous
  userName: string;          // snapshot — survives if user renames
  rating: number;            // 1–5
  comment: string;
  createdAt: string;
}

const STORAGE_KEY = "mongpass:reviews:v1";

export function loadReviews(): Review[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Review[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReviews(list: Review[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function newReviewId(): string {
  return `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function loadReviewsForShop(shopId: string): Review[] {
  return loadReviews()
    .filter((r) => r.shopId === shopId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addReview(input: Omit<Review, "id" | "createdAt">): Review {
  const review: Review = {
    ...input,
    id: newReviewId(),
    createdAt: new Date().toISOString(),
  };
  saveReviews([...loadReviews(), review]);
  return review;
}

export function deleteReview(id: string): void {
  saveReviews(loadReviews().filter((r) => r.id !== id));
}

export interface ReviewSummary {
  count: number;
  average: number;     // rounded to 1 decimal, 0 when count === 0
}

export function summarizeReviews(shopId: string): ReviewSummary {
  const reviews = loadReviews().filter((r) => r.shopId === shopId);
  if (reviews.length === 0) return { count: 0, average: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    count: reviews.length,
    average: Math.round((sum / reviews.length) * 10) / 10,
  };
}

/** Has this user already reviewed this shop? */
export function userHasReviewed(userId: string | null, shopId: string): boolean {
  if (!userId) return false;
  return loadReviews().some((r) => r.shopId === shopId && r.userId === userId);
}
