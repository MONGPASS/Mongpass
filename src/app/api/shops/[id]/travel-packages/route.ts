/**
 * /api/shops/[id]/travel-packages
 *   GET  — public list (any browser). Includes one cover image per
 *          package; full galleries / itineraries are fetched only on
 *          the detail endpoint to keep this response light.
 *   POST — create a package (owner / admin). Body carries full
 *          galleries, included/excluded arrays, and the day list.
 */

export const runtime = "edge";

import { isResponse, requireCatalogRead, requireCatalogWrite } from "@/lib/auth/catalogGuard";

interface PackageRow {
  id: string;
  shop_id: string;
  title: string;
  price: string | null;
  description: string | null;
  duration: string | null;
  group_size: string | null;
  transport: string | null;
  accommodation: string | null;
  guide: string | null;
  tour_type: string | null;
  included_json: string | null;
  excluded_json: string | null;
  status: "available" | "sold_out";
  created_at: string;
}

interface DayRow {
  id: string;
  package_id: string;
  day_number: number;
  title: string;
  description: string | null;
}

const PACKAGE_SELECT = `
  SELECT id, shop_id, title, price, description,
         duration, group_size, transport, accommodation, guide, tour_type,
         included_json, excluded_json, status, created_at
    FROM travel_packages`;

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function rowToPackage(
  r: PackageRow,
  images: string[],
  days: DayRow[],
) {
  return {
    id: r.id,
    shopId: r.shop_id,
    title: r.title,
    price: r.price ?? undefined,
    description: r.description ?? undefined,
    duration: r.duration ?? undefined,
    groupSize: r.group_size ?? undefined,
    transport: r.transport ?? undefined,
    accommodation: r.accommodation ?? undefined,
    guide: r.guide ?? undefined,
    tourType: r.tour_type ?? undefined,
    included: parseJsonArray(r.included_json),
    excluded: parseJsonArray(r.excluded_json),
    status: r.status,
    images,
    days: days.map((d) => ({
      id: d.id,
      dayNumber: d.day_number,
      title: d.title,
      description: d.description ?? undefined,
    })),
    createdAt: r.created_at,
  };
}

interface IncomingDay {
  dayNumber?: number;
  title?: string;
  description?: string;
}

interface IncomingPackage {
  title?: string;
  price?: string;
  description?: string;
  duration?: string;
  groupSize?: string;
  transport?: string;
  accommodation?: string;
  guide?: string;
  tourType?: string;
  included?: string[];
  excluded?: string[];
  images?: string[];
  days?: IncomingDay[];
}

const COLUMN_MAP: Array<[keyof IncomingPackage, string]> = [
  ["price", "price"],
  ["description", "description"],
  ["duration", "duration"],
  ["groupSize", "group_size"],
  ["transport", "transport"],
  ["accommodation", "accommodation"],
  ["guide", "guide"],
  ["tourType", "tour_type"],
];

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogRead(params.id);
  if (isResponse(ctx)) return ctx;

  const rows = await ctx.db
    .prepare(`${PACKAGE_SELECT}
              WHERE shop_id = ?
              ORDER BY created_at DESC
              LIMIT 200`)
    .bind(ctx.shopId)
    .all<PackageRow>();
  const packages = rows.results ?? [];
  if (packages.length === 0) return Response.json({ packages: [] });

  // Pull images + days in two batched queries (rather than N+1).
  const ids = packages.map((p) => p.id);
  const placeholders = ids.map(() => "?").join(",");
  const [imgs, days] = await Promise.all([
    ctx.db
      .prepare(
        `SELECT package_id, r2_key FROM travel_package_images
           WHERE package_id IN (${placeholders})
           ORDER BY package_id, sort_order ASC`,
      )
      .bind(...ids)
      .all<{ package_id: string; r2_key: string }>(),
    ctx.db
      .prepare(
        `SELECT id, package_id, day_number, title, description
           FROM travel_package_days
           WHERE package_id IN (${placeholders})
           ORDER BY package_id, day_number ASC`,
      )
      .bind(...ids)
      .all<DayRow>(),
  ]);

  const imgsByPkg = new Map<string, string[]>();
  for (const r of imgs.results ?? []) {
    const arr = imgsByPkg.get(r.package_id) ?? [];
    arr.push(r.r2_key);
    imgsByPkg.set(r.package_id, arr);
  }
  const daysByPkg = new Map<string, DayRow[]>();
  for (const r of days.results ?? []) {
    const arr = daysByPkg.get(r.package_id) ?? [];
    arr.push(r);
    daysByPkg.set(r.package_id, arr);
  }

  return Response.json({
    packages: packages.map((p) =>
      rowToPackage(p, imgsByPkg.get(p.id) ?? [], daysByPkg.get(p.id) ?? []),
    ),
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const ctx = await requireCatalogWrite(params.id);
  if (isResponse(ctx)) return ctx;

  const body = (await request.json()) as IncomingPackage;
  if (!body.title?.trim()) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const id = `tp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Build column list for the INSERT — title is always present, the
  // rest are optional and stored as TEXT.
  const cols = ["id", "shop_id", "title", "included_json", "excluded_json"];
  const placeholders: string[] = ["?", "?", "?", "?", "?"];
  const values: unknown[] = [
    id,
    ctx.shopId,
    body.title.trim(),
    JSON.stringify(
      Array.isArray(body.included)
        ? body.included.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim())
        : [],
    ),
    JSON.stringify(
      Array.isArray(body.excluded)
        ? body.excluded.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim())
        : [],
    ),
  ];
  for (const [field, column] of COLUMN_MAP) {
    cols.push(column);
    placeholders.push("?");
    const v = body[field];
    values.push(typeof v === "string" && v.trim() ? v.trim() : null);
  }
  const stmts = [
    ctx.db
      .prepare(`INSERT INTO travel_packages (${cols.join(", ")}) VALUES (${placeholders.join(", ")})`)
      .bind(...values),
  ];

  if (Array.isArray(body.images)) {
    body.images.forEach((key, idx) => {
      if (typeof key === "string" && key.trim()) {
        stmts.push(
          ctx.db
            .prepare(
              `INSERT INTO travel_package_images (id, package_id, r2_key, sort_order)
               VALUES (?, ?, ?, ?)`,
            )
            .bind(`img-${id}-${idx}`, id, key.trim(), idx),
        );
      }
    });
  }
  if (Array.isArray(body.days)) {
    body.days.forEach((d, idx) => {
      if (!d.title?.trim()) return;
      stmts.push(
        ctx.db
          .prepare(
            `INSERT INTO travel_package_days
               (id, package_id, day_number, title, description, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            `day-${id}-${idx}`,
            id,
            typeof d.dayNumber === "number" ? d.dayNumber : idx + 1,
            d.title.trim(),
            d.description?.trim() || null,
            idx,
          ),
      );
    });
  }
  await ctx.db.batch(stmts);

  const row = await ctx.db
    .prepare(`${PACKAGE_SELECT} WHERE id = ?`)
    .bind(id)
    .first<PackageRow>();
  if (!row) return Response.json({ error: "Insert failed" }, { status: 500 });
  const [imgs, days] = await Promise.all([
    ctx.db
      .prepare(
        `SELECT r2_key FROM travel_package_images
           WHERE package_id = ? ORDER BY sort_order ASC`,
      )
      .bind(id)
      .all<{ r2_key: string }>(),
    ctx.db
      .prepare(
        `SELECT id, package_id, day_number, title, description
           FROM travel_package_days
           WHERE package_id = ? ORDER BY day_number ASC`,
      )
      .bind(id)
      .all<DayRow>(),
  ]);
  return Response.json(
    {
      package: rowToPackage(
        row,
        (imgs.results ?? []).map((r) => r.r2_key),
        days.results ?? [],
      ),
    },
    { status: 201 },
  );
}
