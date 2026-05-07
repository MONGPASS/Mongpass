/**
 * Community board ("Чөлөөт булан") — Mongolian community in Korea
 * sharing tips, asking questions, posting events, etc.
 *
 * Mirrors the structure a real backend table would have, so when we
 * move to Cloudflare D1 the only thing that changes is the load/save
 * implementation.
 */

export const COMMUNITY_CATEGORIES = [
  "Зөвлөгөө",      // advice / Q&A
  "Худалдаа",      // buy/sell
  "Ажил",          // jobs
  "Үйл явдал",     // events
  "Мэдээ",         // news
  "Алдсан/Олсон",  // lost & found
  "Бусад",         // other
];

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;     // snapshot — survives author renames
  category: string;
  title: string;
  content: string;
  imageDataUrl?: string;
  /** User IDs of people who liked this post. */
  likes: string[];
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

const POSTS_KEY = "mongpass:community:posts:v1";
const COMMENTS_KEY = "mongpass:community:comments:v1";

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function loadPosts(): CommunityPost[] {
  return load<CommunityPost>(POSTS_KEY);
}

export function findPost(id: string): CommunityPost | null {
  return loadPosts().find((p) => p.id === id) ?? null;
}

export function newPostId(): string {
  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newCommentId(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createPost(
  input: Omit<CommunityPost, "id" | "createdAt" | "likes">,
): CommunityPost {
  const post: CommunityPost = {
    ...input,
    id: newPostId(),
    likes: [],
    createdAt: new Date().toISOString(),
  };
  save<CommunityPost>(POSTS_KEY, [post, ...loadPosts()]);
  return post;
}

export function deletePost(id: string): void {
  save<CommunityPost>(POSTS_KEY, loadPosts().filter((p) => p.id !== id));
  // Cascade: delete comments
  save<CommunityComment>(COMMENTS_KEY, loadComments().filter((c) => c.postId !== id));
}

/**
 * Toggle like for a user. Returns the updated post (or null if not
 * found). Idempotent — clicking twice removes the like.
 */
export function toggleLike(postId: string, userId: string): CommunityPost | null {
  const all = loadPosts();
  const idx = all.findIndex((p) => p.id === postId);
  if (idx < 0) return null;
  const post = all[idx];
  const liked = post.likes.includes(userId);
  const next: CommunityPost = {
    ...post,
    likes: liked ? post.likes.filter((id) => id !== userId) : [...post.likes, userId],
  };
  all[idx] = next;
  save<CommunityPost>(POSTS_KEY, all);
  return next;
}

export function loadComments(): CommunityComment[] {
  return load<CommunityComment>(COMMENTS_KEY);
}

export function loadCommentsForPost(postId: string): CommunityComment[] {
  return loadComments()
    .filter((c) => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function countCommentsForPost(postId: string): number {
  return loadComments().filter((c) => c.postId === postId).length;
}

export function addComment(
  input: Omit<CommunityComment, "id" | "createdAt">,
): CommunityComment {
  const comment: CommunityComment = {
    ...input,
    id: newCommentId(),
    createdAt: new Date().toISOString(),
  };
  save<CommunityComment>(COMMENTS_KEY, [...loadComments(), comment]);
  return comment;
}

export function deleteComment(id: string): void {
  save<CommunityComment>(COMMENTS_KEY, loadComments().filter((c) => c.id !== id));
}
