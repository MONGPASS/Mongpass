export const runtime = "edge";

import { isResponse, requireCatalogWrite } from "@/lib/auth/catalogGuard";
import { notFound } from "@/lib/auth/server";

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
    imageDataUrl: undefined,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; doctorId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const owns = await ctx.db
    .prepare("SELECT id FROM doctors WHERE id = ? AND shop_id = ?")
    .bind(params.doctorId, ctx.shopId)
    .first<{ id: string }>();
  if (!owns) return notFound("Doctor not found");

  const body = (await request.json()) as Partial<{
    name: string; department: string; specialty: string; bio: string;
  }>;
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [field, column] of [
    ["name", "name"],
    ["department", "department"],
    ["specialty", "specialty"],
    ["bio", "bio"],
  ] as const) {
    if (body[field] !== undefined) {
      updates.push(`${column} = ?`);
      const v = body[field];
      const optional = field === "specialty" || field === "bio";
      values.push(optional ? (v?.trim() || null) : (v?.trim() ?? ""));
    }
  }
  if (updates.length > 0) {
    values.push(params.doctorId);
    await ctx.db
      .prepare(`UPDATE doctors SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  const row = await ctx.db
    .prepare(
      `SELECT id, shop_id, name, department, specialty, bio, image_r2_key
         FROM doctors WHERE id = ?`,
    )
    .bind(params.doctorId)
    .first<DoctorRow>();
  if (!row) return notFound();
  return Response.json({ doctor: rowToDoctor(row) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; doctorId: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;
  const result = await ctx.db
    .prepare("DELETE FROM doctors WHERE id = ? AND shop_id = ?")
    .bind(params.doctorId, ctx.shopId)
    .run();
  if (!result.meta.changes) return notFound("Doctor not found");
  return Response.json({ ok: true });
}
