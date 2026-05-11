/**
 * Editorial news store — backed by /api/news. Admin-only writes,
 * public reads. Shown in the home "Мэдээ" section and at
 * /news/[id] for the full article.
 */

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  coverR2Key?: string;
  category?: string;
  tags: string[];
  status: "draft" | "published";
  likeCount: number;
  /** Whether the *current* caller has liked this article. */
  liked: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NewsArticleInput = {
  title: string;
  content: string;
  coverR2Key?: string | null;
  category?: string | null;
  tags?: string[];
  status?: "draft" | "published";
};

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function postJson<T>(url: string, body?: unknown): Promise<T | null> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
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

/**
 * `status='all'` returns drafts + published; useful for the admin
 * list. Public callers omit it (server defaults to published).
 * `category` is an optional server-side filter — useful for the
 * dedicated /news page so the client doesn't have to load all
 * articles and filter in memory.
 */
export async function loadNews(
  opts: { status?: "all" | "published"; category?: string } = {},
): Promise<NewsArticle[]> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  if (opts.category) params.set("category", opts.category);
  const qs = params.toString();
  const data = await getJson<{ articles: NewsArticle[] }>(
    `/api/news${qs ? `?${qs}` : ""}`,
  );
  return data?.articles ?? [];
}

export async function findNewsArticle(id: string): Promise<NewsArticle | null> {
  const data = await getJson<{ article: NewsArticle }>(`/api/news/${encodeURIComponent(id)}`);
  return data?.article ?? null;
}

export async function createNewsArticle(input: NewsArticleInput): Promise<NewsArticle | null> {
  const data = await postJson<{ article: NewsArticle }>("/api/news", input);
  return data?.article ?? null;
}

export async function updateNewsArticle(
  id: string,
  patch: Partial<NewsArticleInput>,
): Promise<NewsArticle | null> {
  const data = await patchJson<{ article: NewsArticle }>(
    `/api/news/${encodeURIComponent(id)}`,
    patch,
  );
  return data?.article ?? null;
}

export async function deleteNewsArticle(id: string): Promise<boolean> {
  return del(`/api/news/${encodeURIComponent(id)}`);
}

export async function toggleNewsArticleLike(
  id: string,
): Promise<{ liked: boolean; likeCount: number } | null> {
  return postJson<{ liked: boolean; likeCount: number }>(
    `/api/news/${encodeURIComponent(id)}/like`,
  );
}
