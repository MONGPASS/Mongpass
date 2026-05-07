/**
 * Client-side user store. Talks to `/api/auth/me` to read the current
 * session and caches the result in module memory to avoid hammering
 * the endpoint on every page navigation.
 *
 * The exported function names are kept stable from the localStorage
 * version so consumer files only need to swap `const u = getCurrentUser()`
 * for `const u = await getCurrentUser()`.
 */

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  image_url: string | null;
  role: UserRole;
}

/** undefined = not yet fetched, null = fetched and not signed in. */
let cachedUser: User | null | undefined = undefined;
let pendingFetch: Promise<User | null> | null = null;

/**
 * Returns the currently signed-in user, or null. First call triggers
 * a fetch to /api/auth/me; subsequent calls hit the in-memory cache.
 * Use `invalidateUserCache()` after sign-in/sign-out to force refresh.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (cachedUser !== undefined) return cachedUser;
  if (pendingFetch) return pendingFetch;

  pendingFetch = (async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (!res.ok) {
        cachedUser = null;
        return null;
      }
      const data = (await res.json()) as { user: User | null };
      cachedUser = data.user;
      return data.user;
    } catch {
      cachedUser = null;
      return null;
    } finally {
      pendingFetch = null;
    }
  })();

  return pendingFetch;
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

/** POST /api/auth/logout, then clear the local cache. */
export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } finally {
    invalidateUserCache();
  }
}

/**
 * Force the next `getCurrentUser()` call to fetch fresh data. Useful
 * after a sign-in/out flow that bypassed our cache (e.g., redirect-
 * based OAuth).
 */
export function invalidateUserCache(): void {
  cachedUser = undefined;
  pendingFetch = null;
}

/**
 * Look up a user by id. Used by admin views that show "owner: …" next
 * to a shop. Returns null if not found or the caller isn't allowed to
 * see them. Backed by /api/users/[id] (admin-only).
 */
export async function findUserById(id: string): Promise<User | null> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: User | null };
    return data.user;
  } catch {
    return null;
  }
}
