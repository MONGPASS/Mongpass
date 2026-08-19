/**
 * GET /api/admin/users?q=… — admin-only user directory for the ban
 * screen. `q` matches email or name (substring). Capped at 50 rows —
 * moderation is search-driven, not browse-driven.
 */

export const runtime = "edge";

import { forbidden, getServerContext, unauthorized } from "@/lib/auth/server";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  banned: number;
  banned_reason: string | null;
  created_at: string;
}

export async function GET(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  const conditions: string[] = [];
  const values: unknown[] = [];
  if (q) {
    conditions.push("(email LIKE ? OR name LIKE ?)");
    const like = `%${q}%`;
    values.push(like, like);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await db
    .prepare(
      `SELECT id, email, name, role, banned, banned_reason, created_at
         FROM users ${where}
         ORDER BY created_at DESC
         LIMIT 50`,
    )
    .bind(...values)
    .all<UserRow>();

  return Response.json({
    users: (result.results ?? []).map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      banned: Boolean(r.banned),
      bannedReason: r.banned_reason ?? undefined,
      createdAt: r.created_at,
    })),
  });
}
