/**
 * GET /api/r2/<...key> — stream an object out of R2.
 *
 * We don't expose the bucket publicly; this proxy gives us a stable
 * same-origin URL pattern (`https://mongpass.kr/api/r2/shop/usr-x/…`)
 * that we can store in DB and embed in <img> tags, while keeping the
 * bucket itself private.
 *
 * The 1-year immutable cache header makes this cheap on Cloudflare's
 * edge cache after the first hit.
 */

export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function GET(
  _request: Request,
  { params }: { params: { key: string[] } },
): Promise<Response> {
  const key = params.key.join("/");
  if (!key) return new Response("Bad request", { status: 400 });

  const { env } = getRequestContext();
  const obj = await (env as unknown as CloudflareEnv).IMAGES.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set(
    "Content-Type",
    obj.httpMetadata?.contentType ?? "application/octet-stream",
  );
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (obj.httpEtag) headers.set("ETag", obj.httpEtag);

  return new Response(obj.body as unknown as ReadableStream, { headers });
}
