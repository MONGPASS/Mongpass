/**
 * GET /api/push/public-key — the VAPID public key the browser needs as
 * `applicationServerKey` when subscribing. Empty string when push
 * isn't configured, so the client can hide the enable button.
 */

export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function GET(): Promise<Response> {
  const { env } = getRequestContext();
  const key = (env as unknown as CloudflareEnv).VAPID_PUBLIC_KEY ?? "";
  return Response.json({ publicKey: key });
}
