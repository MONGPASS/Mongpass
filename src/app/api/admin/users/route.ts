/**
 * GET /api/admin/users?q=… — admin-only user directory for the ban
 * screen. `q` matches email or name (substring). Capped at 50 rows —
 * moderation is search-driven, not browse-driven.
 */

export const runtime = "edge";

import { forbidden, getServerContext, unauthorized } from "@/lib/auth/server";
import { clampLimit } from "@/lib/pagination";

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
  const q = url.searchParams.get("q")?.trim().slice(0, 200) ?? "";
  const page = Math.max(
    1,
    Math.min(100000, Math.floor(Number(url.searchParams.get("page")) || 1)),
  );
  const limit = clampLimit(url.searchParams.get("limit"), 20, 50);
  const status = url.searchParams.get("status") || "all";
  if (!["all", "active", "banned", "admin"].includes(status))
    return Response.json({ error: "Invalid status" }, { status: 400 });

  const conditions: string[] = [];
  const values: unknown[] = [];
  if (q) {
    conditions.push("(email LIKE ? OR name LIKE ?)");
    const like = `%${q}%`;
    values.push(like, like);
  }
  if (status === "banned") conditions.push("banned = 1");
  if (status === "active") conditions.push("banned = 0");
  if (status === "admin") conditions.push("role = 'admin'");
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const count = await db
    .prepare(`SELECT COUNT(*) AS count FROM users ${where}`)
    .bind(...values)
    .first<{ count: number }>();

  const result = await db
    .prepare(
      `SELECT id, email, name, role, banned, banned_reason, created_at
         FROM users ${where}
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
    )
    .bind(...values, limit, (page - 1) * limit)
    .all<UserRow>();

  return Response.json({
    page,
    limit,
    total: count?.count ?? 0,
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
