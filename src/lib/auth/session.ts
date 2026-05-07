/**
 * Hand-rolled session module — a small, edge-runtime-safe replacement
 * for Lucia v3 (which has been deprecated by its author). Uses the
 * official successor primitives (`@oslojs/crypto`, `@oslojs/encoding`).
 *
 * Tokens are random base32 strings stored in an httpOnly cookie. The
 * server stores only the SHA-256 hash of the token, so a DB leak does
 * not reveal valid session tokens.
 */

import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import type { D1Database } from "@cloudflare/workers-types";
import type { ResponseCookies } from "next/dist/server/web/spec-extension/cookies";

export const SESSION_COOKIE_NAME = "mongpass_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SESSION_RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 15; // renew when <15 days left

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image_url: string | null;
  role: "user" | "admin";
}

export interface Session {
  id: string;        // SHA-256(token), hex
  userId: string;
  expiresAt: Date;
}

export interface SessionValidationResult {
  session: Session;
  user: SessionUser;
}

/** Generate a cryptographically random session token (≈160 bits). */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

/** Map a token to its DB id (SHA-256 hex). */
function hashToken(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

/** Persist a session row for the given user and return the metadata. */
export async function createSession(
  db: D1Database,
  token: string,
  userId: string,
): Promise<Session> {
  const id = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db
    .prepare(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    )
    .bind(id, userId, expiresAt.getTime())
    .run();
  return { id, userId, expiresAt };
}

/**
 * Validate a session token from a cookie. If valid, returns the joined
 * session+user record. If the session is past 50% of its TTL we extend
 * it transparently (sliding window).
 */
export async function validateSessionToken(
  db: D1Database,
  token: string,
): Promise<SessionValidationResult | null> {
  const id = hashToken(token);
  const row = await db
    .prepare(
      `SELECT s.id AS session_id, s.user_id, s.expires_at,
              u.email, u.name, u.image_url, u.role, u.banned
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.id = ?`,
    )
    .bind(id)
    .first<{
      session_id: string;
      user_id: string;
      expires_at: number;
      email: string;
      name: string;
      image_url: string | null;
      role: "user" | "admin";
      banned: number;
    }>();

  if (!row) return null;

  // Banned users are immediately logged out — clear the session row.
  if (row.banned) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
    return null;
  }

  const now = Date.now();
  if (row.expires_at <= now) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
    return null;
  }

  // Sliding renewal: if more than half the TTL has elapsed, push expiry
  // forward so active users don't get logged out unexpectedly.
  let expiresAt = new Date(row.expires_at);
  if (now > row.expires_at - SESSION_RENEW_THRESHOLD_MS) {
    expiresAt = new Date(now + SESSION_TTL_MS);
    await db
      .prepare("UPDATE sessions SET expires_at = ? WHERE id = ?")
      .bind(expiresAt.getTime(), id)
      .run();
  }

  return {
    session: { id: row.session_id, userId: row.user_id, expiresAt },
    user: {
      id: row.user_id,
      email: row.email,
      name: row.name,
      image_url: row.image_url,
      role: row.role,
    },
  };
}

/** Delete a session row by its DB id. */
export async function invalidateSession(
  db: D1Database,
  sessionId: string,
): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
}

/** Set the session cookie on a Route Handler response. */
export function setSessionCookie(
  cookies: ResponseCookies,
  token: string,
  expiresAt: Date,
): void {
  cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Clear the session cookie (logout). */
export function clearSessionCookie(cookies: ResponseCookies): void {
  cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
