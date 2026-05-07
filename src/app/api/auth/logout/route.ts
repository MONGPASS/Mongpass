/**
 * POST /api/auth/logout — invalidate the current session and clear the cookie.
 */

export const runtime = "edge";

import { cookies } from "next/headers";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { SESSION_COOKIE_NAME, clearSessionCookie } from "@/lib/auth/session";

export async function POST(): Promise<Response> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const id = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const { env } = getRequestContext();
    const db = (env as unknown as CloudflareEnv).DB;
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
  }

  clearSessionCookie(cookieStore);
  return Response.json({ ok: true });
}
