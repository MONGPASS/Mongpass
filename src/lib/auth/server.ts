/**
 * Server-only auth helpers shared by every API route. Reads the
 * session cookie, validates it, and returns the D1 binding plus the
 * authenticated user (or null). Centralised so individual routes stay
 * focused on their business logic.
 */

import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import {
  SESSION_COOKIE_NAME,
  SessionUser,
  validateSessionToken,
} from "@/lib/auth/session";

export interface ServerEnv {
  db: D1Database;
  images: R2Bucket;
  user: SessionUser | null;
}

/** Reads bindings + the session user (if any). Never throws. */
export async function getServerContext(): Promise<ServerEnv> {
  const { env } = getRequestContext();
  const cf = env as unknown as CloudflareEnv;
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  let user: SessionUser | null = null;
  if (token) {
    const result = await validateSessionToken(cf.DB, token);
    user = result?.user ?? null;
  }
  return { db: cf.DB, images: cf.IMAGES, user };
}

/** Standard 401 JSON response. */
export function unauthorized(): Response {
  return Response.json({ error: "Authentication required" }, { status: 401 });
}

/** Standard 403 JSON response. */
export function forbidden(): Response {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

/** Standard 404 JSON response. */
export function notFound(message = "Not found"): Response {
  return Response.json({ error: message }, { status: 404 });
}
