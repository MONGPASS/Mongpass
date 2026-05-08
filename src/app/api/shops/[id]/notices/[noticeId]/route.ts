/**
 * /api/shops/[id]/notices/[noticeId]
 *   PATCH  — edit title / content (owner / admin)
 *   DELETE — remove notice (owner / admin)
 */

export const runtime = "edge";

import { isResponse, requireCatalogWrite } from "@/lib/auth/catalogGuard";
import { notFound } from "@/lib/auth/server";

interface NoticeRow {
  id: string;
  shop_id: string;
  title: string;
  content: string;
  created_at: string;
}

function rowToNotice(r: NoticeRow) {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    createdAt: r.created_at,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; noticeId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const owns = await ctx.db
    .prepare("SELECT id FROM shop_notices WHERE id = ? AND shop_id = ?")
    .bind(params.noticeId, ctx.shopId)
    .first<{ id: string }>();
  if (!owns) return notFound("Notice not found");

  const body = (await request.json()) as Partial<{ title: string; content: string }>;
  const updates: string[] = [];
  const values: unknown[] = [];
  if (body.title !== undefined) {
    if (!body.title.trim()) {
      return Response.json({ error: "title cannot be empty" }, { status: 400 });
    }
    updates.push("title = ?");
    values.push(body.title.trim());
  }
  if (body.content !== undefined) {
    if (!body.content.trim()) {
      return Response.json({ error: "content cannot be empty" }, { status: 400 });
    }
    updates.push("content = ?");
    values.push(body.content.trim());
  }
  if (updates.length > 0) {
    values.push(params.noticeId);
    await ctx.db
      .prepare(`UPDATE shop_notices SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, title, content, created_at
         FROM shop_notices WHERE id = ?`,
    )
    .bind(params.noticeId)
    .first<NoticeRow>();
  if (!row) return notFound();
  return Response.json({ notice: rowToNotice(row) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; noticeId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;
  const result = await ctx.db
    .prepare("DELETE FROM shop_notices WHERE id = ? AND shop_id = ?")
    .bind(params.noticeId, ctx.shopId)
    .run();
  if (!result.meta.changes) return notFound("Notice not found");
  return Response.json({ ok: true });
}
