/**
 * GET /api/users/[id] — return basic user info. Admin-only.
 * Used by the admin shops view to show the owner of each pending shop.
 */

export const runtime = "edge";

import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { SESSION_COOKIE_NAME, validateSessionToken } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return Response.json({ user: null }, { status: 401 });

  const { env } = getRequestContext();
  const db = (env as unknown as CloudflareEnv).DB;

  const session = await validateSessionToken(db, token);
  if (!session) return Response.json({ user: null }, { status: 401 });
  if (session.user.role !== "admin") {
    return Response.json({ user: null }, { status: 403 });
  }

  const row = await db
    .prepare("SELECT id, email, name, image_url, role FROM users WHERE id = ?")
    .bind(params.id)
    .first<{
      id: string;
      email: string;
      name: string;
      image_url: string | null;
      role: "user" | "admin";
    }>();

  return Response.json({ user: row ?? null });
}
