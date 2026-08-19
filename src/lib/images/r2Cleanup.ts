/**
 * Server-side R2 cleanup for delete flows. DB rows cascade on delete,
 * but the image objects they pointed at used to stay in the bucket
 * forever — every deleted shop or post leaked its gallery.
 *
 * Best-effort by design: a failed R2 delete must never block the DB
 * delete the user asked for (an orphaned image is a cost bug, not a
 * correctness bug).
 */

import type { R2Bucket } from "@cloudflare/workers-types";

/**
 * Normalise a stored image reference to an R2 key, or null when it
 * isn't one (legacy rows may hold base64 data URLs or external URLs;
 * some columns store the /api/r2/<key> proxy path).
 */
export function toR2Key(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("/api/r2/")) return value.slice("/api/r2/".length);
  if (value.startsWith("data:") || value.startsWith("http") || value.startsWith("/")) {
    return null;
  }
  return value;
}

/** Delete a batch of image references from R2, ignoring failures. */
export async function deleteR2Objects(
  images: R2Bucket,
  values: Array<string | null | undefined>,
): Promise<void> {
  const keys = Array.from(
    new Set(values.map(toR2Key).filter((k): k is string => k !== null)),
  );
  if (keys.length === 0) return;
  try {
    // R2's delete accepts up to 1000 keys per call; our galleries are
    // far below that, but chunk anyway so a big shop can't hit it.
    for (let i = 0; i < keys.length; i += 900) {
      await images.delete(keys.slice(i, i + 900));
    }
  } catch {
    /* best-effort — see module docblock */
  }
}
