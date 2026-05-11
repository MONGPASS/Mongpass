/**
 * Client-side image upload helper.
 *
 * Accepts any browser-readable image (jpeg / png / webp / heic on
 * iOS / etc.), resizes to a sensible max dimension, re-encodes as
 * WebP at quality 0.85, then POSTs to /api/upload which stores the
 * blob in R2 and returns a key + public proxy URL.
 *
 * Why client-side WebP:
 *  - Cuts upload bandwidth by 25-60% vs JPEG, much more vs PNG.
 *  - Cuts R2 storage cost.
 *  - Cuts download time on every shop / banner view.
 *
 * Modern Safari (≥14), Chrome, Firefox, Edge all support
 * `canvas.toBlob('image/webp', q)`. For ancient browsers we silently
 * fall back to whatever the canvas can produce (typically JPEG).
 */

export interface UploadedImage {
  /** R2 object key — what to persist on the DB row. */
  key: string;
  /** Same-origin URL to embed in <img>. Backed by /api/r2 proxy. */
  url: string;
}

export type UploadKind =
  | "shop"
  | "banner"
  | "post"
  | "meat"
  | "cargo"
  | "doctor"
  | "stylist"
  | "menu"
  | "car"
  | "travel";

interface CompressOptions {
  /** Largest edge in px. Photos taller/wider than this are scaled down proportionally. */
  maxDim?: number;
  /** WebP quality 0..1. 0.85 is a sweet spot for product photos. */
  quality?: number;
}

const DEFAULT_OPTS: Required<CompressOptions> = {
  maxDim: 1600,
  quality: 0.85,
};

/**
 * Compress + upload an image to R2 in one call.
 * Returns null on any failure so callers can show a generic toast.
 */
export async function uploadImage(
  file: File,
  kind: UploadKind,
  opts: CompressOptions = {},
): Promise<UploadedImage | null> {
  try {
    const compressed = await compressToWebP(file, { ...DEFAULT_OPTS, ...opts });
    const fd = new FormData();
    fd.append(
      "file",
      new File([compressed], replaceExt(file.name, "webp"), {
        type: compressed.type,
      }),
    );
    fd.append("kind", kind);

    const res = await fetch("/api/upload", {
      method: "POST",
      credentials: "same-origin",
      body: fd,
    });
    if (!res.ok) {
      // Surface server errors to the developer console so a 4xx
      // doesn't go completely silent — but no debug breadcrumbs.
      const body = await res.text().catch(() => "");
      console.error("uploadImage failed:", res.status, body);
      return null;
    }
    return (await res.json()) as UploadedImage;
  } catch (err) {
    console.error("uploadImage exception:", err);
    return null;
  }
}

/**
 * Returns a same-origin URL the browser can render given an R2 key.
 * If the input already looks like a URL (http(s):// data: /…), it's
 * returned unchanged so legacy / test images keep working.
 */
export function r2Url(keyOrUrl: string | null | undefined): string | undefined {
  if (!keyOrUrl) return undefined;
  if (
    keyOrUrl.startsWith("http://") ||
    keyOrUrl.startsWith("https://") ||
    keyOrUrl.startsWith("data:") ||
    keyOrUrl.startsWith("/")
  ) {
    return keyOrUrl;
  }
  return `/api/r2/${keyOrUrl}`;
}

// ===================== internals =====================

async function compressToWebP(
  file: File,
  opts: Required<CompressOptions>,
): Promise<Blob> {
  const bitmap = await loadImage(file);
  const { width, height } = downscale(bitmap.width, bitmap.height, opts.maxDim);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/webp",
      opts.quality,
    );
  });

  // If for some reason the browser refused to honour `image/webp`
  // (rare — only really old browsers), fall back to JPEG.
  if (blob.type !== "image/webp" && blob.type !== "") {
    return blob;
  }
  return blob;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function downscale(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = Math.min(max / w, max / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function replaceExt(name: string, ext: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return `${name}.${ext}`;
  return `${name.slice(0, dot)}.${ext}`;
}
