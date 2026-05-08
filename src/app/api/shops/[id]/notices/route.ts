/**
 * /api/shops/[id]/notices
 *   GET  — list this shop's notices, newest first (public for approved shops)
 *   POST — { title, content } — create a new notice. Owner / admin only.
 */

export const runtime = "edge";

import { isResponse, requireCatalogRead, requireCatalogWrite } from "@/lib/auth/catalogGuard";

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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogRead(params.id);
  if (isResponse(ctx)) return ctx;
  const result = await ctx.db
    .prepare(
      `SELECT id, shop_id, title, content, created_at
         FROM shop_notices WHERE shop_id = ?
         ORDER BY created_at DESC, rowid DESC`,
    )
    .bind(ctx.shopId)
    .all<NoticeRow>();
  return Response.json({ notices: (result.results ?? []).map(rowToNotice) });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const body = (await request.json()) as Partial<{ title: string; content: string }>;
  if (!body.title?.trim() || !body.content?.trim()) {
    return Response.json({ error: "title and content are required" }, { status: 400 });
  }

  const id = `notice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await ctx.db
    .prepare(
      `INSERT INTO shop_notices (id, shop_id, title, content)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, ctx.shopId, body.title.trim(), body.content.trim())
    .run();

  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, title, content, created_at
         FROM shop_notices WHERE id = ?`,
    )
    .bind(id)
    .first<NoticeRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  return Response.json({ notice: rowToNotice(row) }, { status: 201 });
}
