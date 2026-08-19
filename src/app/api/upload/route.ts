/**
 * POST /api/upload — body: multipart/form-data { file, kind }
 *   Receives a (typically already client-side WebP-converted) image
 *   and stores it in R2 under a key the caller can persist on the
 *   relevant DB row.
 *
 * Validation: caller must be authenticated, file ≤ 5 MB, kind in the
 * known whitelist (so a malicious client can't spam keys outside our
 * tree). Server-side image processing (e.g. additional resize) is left
 * to a future phase — Phase 5 trusts the client to have already
 * converted to WebP and resized.
 *
 * Returns: { key, url }. The `url` is `/api/r2/<key>` — a same-origin
 * proxy that streams from R2, so we don't have to expose the R2 bucket
 * publicly or set up a custom domain on it.
 */

export const runtime = "edge";

import { forbidden, getServerContext, unauthorized } from "@/lib/auth/server";

const MAX_BYTES = 5_000_000; // 5 MB after client-side WebP compression

// Per-user rate limits. Generous for legitimate use — a shop owner
// uploading a full gallery plus a product catalog stays well inside —
// but a scripted abuser can no longer stream 5 MB files into R2
// indefinitely on a free account.
const MAX_PER_HOUR = 30;
const MAX_PER_DAY = 150;
const ALLOWED_KINDS = new Set([
  "shop",        // shop banners
  "banner",      // homepage banners
  "post",        // community post images
  "meat",        // meat product photos
  "cargo",       // cargo order item photos
  "doctor",      // hospital doctor photos
  "stylist",     // beauty stylist photos
  "menu",        // menu item photos
  "car",         // used-car listing gallery photos
  "travel",      // travel package gallery photos
  "news",        // editorial news article cover photos
]);
const ALLOWED_TYPES = new Set([
  "image/webp",
  "image/jpeg",
  "image/png",
]);

function safeRand(): string {
  // crypto.randomUUID is available in Cloudflare Workers Edge runtime.
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function POST(request: Request): Promise<Response> {
  const { db, images, user } = await getServerContext();
  if (!user) return unauthorized();

  // Rate limit check — one query returns both window counts.
  const counts = await db
    .prepare(
      `SELECT
         SUM(CASE WHEN created_at > datetime('now', '-1 hour') THEN 1 ELSE 0 END) AS hour_n,
         COUNT(*) AS day_n
        FROM upload_log
       WHERE user_id = ? AND created_at > datetime('now', '-1 day')`,
    )
    .bind(user.id)
    .first<{ hour_n: number | null; day_n: number }>();
  if ((counts?.hour_n ?? 0) >= MAX_PER_HOUR || (counts?.day_n ?? 0) >= MAX_PER_DAY) {
    return Response.json(
      { error: "Upload limit reached. Try again later." },
      { status: 429 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "");

  if (!(file instanceof File)) {
    return Response.json({ error: "file is required" }, { status: 400 });
  }
  if (!ALLOWED_KINDS.has(kind)) return forbidden();
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: `unsupported type: ${file.type}` }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "file too large" }, { status: 413 });
  }

  const ext = file.type === "image/webp" ? "webp" : file.type === "image/jpeg" ? "jpg" : "png";
  const key = `${kind}/${user.id}/${Date.now()}-${safeRand()}.${ext}`;

  // The file is already capped at 5 MB so buffering it before
  // forwarding to R2 is fine. ArrayBuffer plays nicely with the R2
  // binding's typings, unlike `file.stream()` which mismatches the
  // ReadableStream variants between DOM and Workers types.
  const buffer = await file.arrayBuffer();
  await images.put(key, buffer, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      uploadedBy: user.id,
      kind,
    },
  });

  // Record the upload for the rate limiter and sweep this user's rows
  // that have aged out of every window — keeps the table from growing
  // without a scheduled job.
  await db.batch([
    db
      .prepare("INSERT INTO upload_log (id, user_id) VALUES (?, ?)")
      .bind(`upl-${Date.now()}-${safeRand()}`, user.id),
    db
      .prepare(
        "DELETE FROM upload_log WHERE user_id = ? AND created_at < datetime('now', '-1 day')",
      )
      .bind(user.id),
  ]);

  return Response.json({ key, url: `/api/r2/${key}` }, { status: 201 });
}
