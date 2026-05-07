/**
 * GET /api/auth/me — return the currently signed-in user, or `null` if
 * there is no valid session. Client-side `getCurrentUser()` calls this.
 */

export const runtime = "edge";

import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import {
  SESSION_COOKIE_NAME,
  setSessionCookie,
  validateSessionToken,
} from "@/lib/auth/session";

export async function GET(): Promise<Response> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return Response.json({ user: null });
  }

  const { env } = getRequestContext();
  const db = (env as unknown as CloudflareEnv).DB;
  const result = await validateSessionToken(db, token);

  if (!result) {
    // Stale or invalid token — clear the cookie so the client stops sending it
    cookieStore.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return Response.json({ user: null });
  }

  // Slide the cookie expiry forward when we extended the session
  setSessionCookie(cookieStore, token, result.session.expiresAt);

  return Response.json({ user: result.user });
}
