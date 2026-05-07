/**
 * Lightweight user/session store backed entirely by localStorage.
 *
 * Real auth (passwords, JWT, OAuth) is out of scope for the demo —
 * users are identified by a unique `name` they pick when "logging in".
 * If the name doesn't exist, we create a User record. If it does, we
 * just adopt that User as the current session.
 *
 * When we move to a real backend (Cloudflare D1 + Auth.js), this file
 * is the only client-side spot that needs to swap the implementation.
 */

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  name: string;
  phone?: string;
  /** "admin" can access the super-admin dashboard at /admin. */
  role: UserRole;
  /** When true, the user is suspended by an admin. Logged-out on next visit. */
  banned?: boolean;
  bannedReason?: string;
  bannedAt?: string;   // ISO
  createdAt: string;   // ISO date
}

/**
 * Demo-mode admin gate: any user whose name (case-insensitive) is "admin"
 * gets the admin role automatically. Real auth would be a backend role
 * assignment, but this lets us test the full flow without a server.
 */
function deriveRole(name: string): UserRole {
  return name.trim().toLowerCase() === "admin" ? "admin" : "user";
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

const USERS_KEY = "mongpass:users:v1";
const CURRENT_USER_KEY = "mongpass:current-user-id";

export function loadUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as User[];
    if (!Array.isArray(parsed)) return [];
    // Migration: pre-role users get a role derived from their name.
    return parsed.map((u) => ({
      ...u,
      role: (u.role as UserRole | undefined) ?? deriveRole(u.name),
    }));
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByName(name: string): User | null {
  const trimmed = name.trim().toLowerCase();
  return loadUsers().find((u) => u.name.trim().toLowerCase() === trimmed) ?? null;
}

export function findUserById(id: string): User | null {
  return loadUsers().find((u) => u.id === id) ?? null;
}

export function newUserId(): string {
  return `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createUser(name: string, phone?: string): User {
  const user: User = {
    id: newUserId(),
    name: name.trim(),
    phone: phone?.trim() || undefined,
    role: deriveRole(name),
    createdAt: new Date().toISOString(),
  };
  saveUsers([...loadUsers(), user]);
  return user;
}

/** Get the current user, or null if not logged in. */
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!id) return null;
  return findUserById(id);
}

export function setCurrentUser(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) {
    window.localStorage.setItem(CURRENT_USER_KEY, id);
  } else {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }
}

/**
 * "Log in" by name — adopts an existing user with this name, or creates
 * a new one. Sets them as the current session and returns the User.
 */
export function loginOrSignup(name: string, phone?: string): User {
  const existing = findUserByName(name);
  const user = existing ?? createUser(name, phone);
  setCurrentUser(user.id);
  return user;
}

export function logout(): void {
  setCurrentUser(null);
}

/** Admin action — suspend or unsuspend a user. */
export function setUserBanned(userId: string, banned: boolean, reason?: string): User | null {
  const all = loadUsers();
  const idx = all.findIndex((u) => u.id === userId);
  if (idx < 0) return null;
  const next: User = {
    ...all[idx],
    banned,
    bannedReason: banned ? reason : undefined,
    bannedAt: banned ? new Date().toISOString() : undefined,
  };
  all[idx] = next;
  saveUsers(all);
  // If we banned the currently-logged-in user, force-logout
  if (banned && getCurrentUser()?.id === userId) {
    setCurrentUser(null);
  }
  return next;
}
