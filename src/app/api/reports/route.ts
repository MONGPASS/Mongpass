/**
 * /api/reports
 *   POST { targetType, targetId, reason } — flag content for the
 *        moderation queue (auth required; one report per target per
 *        user — repeats return 200 without a new row).
 *   GET  ?status=open|resolved — admin only. Each row is enriched
 *        with a human-readable preview of the reported target so the
 *        moderator can triage without opening every link.
 */

export const runtime = "edge";

import { forbidden, getServerContext, unauthorized } from "@/lib/auth/server";

const TARGET_TYPES = new Set(["post", "comment", "review", "shop"]);
const MAX_REASON = 500;

interface ReportRow {
  id: string;
  reporter_id: string;
  reporter_name: string | null;
  target_type: "post" | "comment" | "review" | "shop";
  target_id: string;
  reason: string;
  status: "open" | "resolved";
  created_at: string;
}

export async function POST(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();

  const body = (await request.json().catch(() => null)) as {
    targetType?: string;
    targetId?: string;
    reason?: string;
  } | null;
  const targetType = body?.targetType ?? "";
  const targetId = body?.targetId?.trim() ?? "";
  const reason = body?.reason?.trim() ?? "";
  if (!TARGET_TYPES.has(targetType) || !targetId || !reason) {
    return Response.json(
      { error: "targetType, targetId, reason are required" },
      { status: 400 },
    );
  }

  const id = `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  // OR IGNORE + the unique (reporter, target) index: re-reporting the
  // same thing is a no-op success, not an error — the reporter doesn't
  // care that they already flagged it, and the queue stays clean.
  await db
    .prepare(
      `INSERT OR IGNORE INTO reports (id, reporter_id, target_type, target_id, reason)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(id, user.id, targetType, targetId, reason.slice(0, MAX_REASON))
    .run();

  return Response.json({ ok: true }, { status: 201 });
}

export async function GET(request: Request): Promise<Response> {
  const { db, user } = await getServerContext();
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  const url = new URL(request.url);
  const status = url.searchParams.get("status") === "resolved" ? "resolved" : "open";

  const result = await db
    .prepare(
      `SELECT r.id, r.reporter_id, u.name AS reporter_name, r.target_type,
              r.target_id, r.reason, r.status, r.created_at
         FROM reports r
         LEFT JOIN users u ON u.id = r.reporter_id
        WHERE r.status = ?
        ORDER BY r.created_at DESC
        LIMIT 100`,
    )
    .bind(status)
    .all<ReportRow>();
  const rows = result.results ?? [];

  // Enrich with a preview per target type. One query per type present
  // in the page (max 4), not one per row.
  const byType = new Map<string, string[]>();
  for (const r of rows) {
    const list = byType.get(r.target_type) ?? [];
    list.push(r.target_id);
    byType.set(r.target_type, list);
  }
  const previews = new Map<string, string>();
  const key = (t: string, id: string) => `${t}:${id}`;

  async function collect(
    type: string,
    sql: string,
  ): Promise<void> {
    const ids = byType.get(type);
    if (!ids || ids.length === 0) return;
    const placeholders = ids.map(() => "?").join(",");
    const res = await db
      .prepare(sql.replace("__IDS__", placeholders))
      .bind(...ids)
      .all<{ id: string; preview: string }>();
    for (const row of res.results ?? []) {
      previews.set(key(type, row.id), row.preview);
    }
  }

  await Promise.all([
    collect("post", "SELECT id, title AS preview FROM community_posts WHERE id IN (__IDS__)"),
    collect("comment", "SELECT id, content AS preview FROM community_comments WHERE id IN (__IDS__)"),
    collect("review", "SELECT id, comment AS preview FROM reviews WHERE id IN (__IDS__)"),
    collect("shop", "SELECT id, name AS preview FROM shops WHERE id IN (__IDS__)"),
  ]);

  return Response.json({
    reports: rows.map((r) => ({
      id: r.id,
      reporterId: r.reporter_id,
      reporterName: r.reporter_name ?? "—",
      targetType: r.target_type,
      targetId: r.target_id,
      // "(устгагдсан)" = target already deleted; keep the report so
      // the moderator can still see the pattern / ban the reporter's
      // target if needed, then resolve it.
      targetPreview:
        previews.get(key(r.target_type, r.target_id)) ?? "(устгагдсан)",
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
    })),
  });
}
