/**
 * Community board (Чөлөөт булан) — backed by /api/community/* (D1).
 */

export const COMMUNITY_CATEGORIES = [
  "Ажлын зар",
  "Виз зөвлөгөө",
  "Эрүүл мэнд",
  "Байр сууц",
  "Мэдэхэд илүүдэхгүй",
  "Бусад",
];

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  category: string;
  title: string;
  content: string;
  /** R2 key or /api/r2/<key> URL — r2Url() handles either form. */
  imageDataUrl?: string;
  likes: string[];
  likeCount?: number;
  commentCount?: number;
  createdAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

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

async function del(url: string): Promise<boolean> {
  const res = await fetch(url, { method: "DELETE", credentials: "same-origin" });
  return res.ok;
}

// ===================== Posts =====================

export async function loadPosts(category?: string): Promise<CommunityPost[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  const data = await getJson<{ posts: CommunityPost[] }>(`/api/community/posts${qs}`);
  return data?.posts ?? [];
}

export async function findPost(id: string): Promise<CommunityPost | null> {
  const data = await getJson<{ post: CommunityPost }>(
    `/api/community/posts/${encodeURIComponent(id)}`,
  );
  return data?.post ?? null;
}

export async function createPost(
  input: Omit<CommunityPost, "id" | "createdAt" | "likes">,
): Promise<CommunityPost | null> {
  void input.authorId;
  void input.authorName; // server derives from session
  const data = await postJson<{ post: CommunityPost }>("/api/community/posts", {
    category: input.category,
    title: input.title,
    content: input.content,
    imageDataUrl: input.imageDataUrl,
  });
  return data?.post ?? null;
}

export async function deletePost(id: string): Promise<boolean> {
  return del(`/api/community/posts/${encodeURIComponent(id)}`);
}

export async function toggleLike(
  postId: string,
  userId: string,
): Promise<{ liked: boolean; likeCount: number } | null> {
  void userId;
  const data = await postJson<{ liked: boolean; likeCount: number }>(
    `/api/community/posts/${encodeURIComponent(postId)}/like`,
  );
  return data ?? null;
}

// ===================== Comments =====================

export async function loadCommentsForPost(postId: string): Promise<CommunityComment[]> {
  const data = await getJson<{ comments: CommunityComment[] }>(
    `/api/community/posts/${encodeURIComponent(postId)}/comments`,
  );
  return data?.comments ?? [];
}

export async function addComment(
  input: Omit<CommunityComment, "id" | "createdAt">,
): Promise<CommunityComment | null> {
  void input.authorId;
  void input.authorName;
  const data = await postJson<{ comment: CommunityComment }>(
    `/api/community/posts/${encodeURIComponent(input.postId)}/comments`,
    { content: input.content },
  );
  return data?.comment ?? null;
}

export async function deleteComment(postId: string, id: string): Promise<boolean> {
  return del(
    `/api/community/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(id)}`,
  );
}
