/** /api/shops/[id]/doctors — list + create hospital doctors. */

export const runtime = "edge";

import { isResponse, requireCatalogRead, requireCatalogWrite } from "@/lib/auth/catalogGuard";

interface DoctorRow {
  id: string;
  shop_id: string;
  name: string;
  department: string;
  specialty: string | null;
  bio: string | null;
  image_r2_key: string | null;
}

function rowToDoctor(r: DoctorRow) {
  return {
    id: r.id,
    name: r.name,
    department: r.department,
    specialty: r.specialty ?? undefined,
    bio: r.bio ?? undefined,
    imageDataUrl: undefined, // R2 image swap lands in Phase 5
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
      `SELECT id, shop_id, name, department, specialty, bio, image_r2_key
         FROM doctors WHERE shop_id = ? ORDER BY rowid`,
    )
    .bind(ctx.shopId)
    .all<DoctorRow>();
  return Response.json({ doctors: (result.results ?? []).map(rowToDoctor) });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const body = (await request.json()) as Partial<{
    name: string; department: string; specialty: string; bio: string;
  }>;
  if (!body.name?.trim() || !body.department?.trim()) {
    return Response.json({ error: "name and department are required" }, { status: 400 });
  }

  const id = `dr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await ctx.db
    .prepare(
      `INSERT INTO doctors (id, shop_id, name, department, specialty, bio)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, ctx.shopId, body.name.trim(), body.department.trim(), body.specialty?.trim() || null, body.bio?.trim() || null)
    .run();
  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, name, department, specialty, bio, image_r2_key
         FROM doctors WHERE id = ?`,
    )
    .bind(id)
    .first<DoctorRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  return Response.json({ doctor: rowToDoctor(row) }, { status: 201 });
}
