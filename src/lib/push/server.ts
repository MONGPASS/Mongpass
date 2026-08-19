/**
 * Server-side Web Push sender — edge-runtime only (WebCrypto, no Node
 * APIs, so the popular `web-push` package is out).
 *
 * We send *payload-less* pushes: the service worker wakes on the push
 * event and fetches /api/me/badges to decide what to show. That keeps
 * this module down to VAPID JWT signing — no RFC 8291 aes128gcm
 * payload encryption to maintain.
 *
 * All send failures are swallowed (push is best-effort); 404/410 from
 * the push service means the subscription is dead and we delete it.
 */

import type { D1Database } from "@cloudflare/workers-types";

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** UTF-8 encode into a fresh ArrayBuffer-backed view (BufferSource-safe). */
function utf8(s: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(s);
  const copy = new Uint8Array(new ArrayBuffer(encoded.length));
  copy.set(encoded);
  return copy;
}

/**
 * Build the VAPID `Authorization: vapid t=<jwt>, k=<pub>` header for a
 * push-service origin. JWTs are cached per origin for the worker's
 * lifetime — signing is cheap but there's no reason to redo it for
 * every subscriber on the same push service.
 */
const jwtCache = new Map<string, { header: string; expiresAtMs: number }>();

async function vapidAuthHeader(
  env: CloudflareEnv,
  audience: string,
): Promise<string | null> {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_JWK, VAPID_SUBJECT } = env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_JWK) return null;

  const cached = jwtCache.get(audience);
  if (cached && cached.expiresAtMs > Date.now() + 60_000) return cached.header;

  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + 12 * 60 * 60; // max allowed is 24h; 12h is safe
  const headerPart = base64UrlEncode(
    utf8(JSON.stringify({ typ: "JWT", alg: "ES256" })),
  );
  const payloadPart = base64UrlEncode(
    utf8(
      JSON.stringify({
        aud: audience,
        exp: expSec,
        sub: VAPID_SUBJECT || "mailto:admin@mongpass.example",
      }),
    ),
  );
  const signingInput = `${headerPart}.${payloadPart}`;

  const key = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(VAPID_PRIVATE_JWK),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  // WebCrypto ECDSA emits raw r||s (64 bytes) — exactly the JOSE ES256
  // signature format, no DER conversion needed.
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    utf8(signingInput),
  );
  const jwt = `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;

  const header = `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`;
  jwtCache.set(audience, { header, expiresAtMs: expSec * 1000 });
  return header;
}

/**
 * Ping every push subscription the user has. Fire-and-forget friendly:
 * wrap the returned promise in `ctx.waitUntil` so the API response
 * doesn't wait on push services.
 */
export async function sendPushToUser(
  db: D1Database,
  env: CloudflareEnv,
  userId: string,
): Promise<void> {
  let endpoints: string[];
  try {
    const result = await db
      .prepare("SELECT endpoint FROM push_subscriptions WHERE user_id = ?")
      .bind(userId)
      .all<{ endpoint: string }>();
    endpoints = (result.results ?? []).map((r) => r.endpoint);
  } catch {
    return; // table missing / DB hiccup — push is best-effort
  }

  await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        const audience = new URL(endpoint).origin;
        const auth = await vapidAuthHeader(env, audience);
        if (!auth) return; // VAPID keys not configured
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: auth,
            TTL: "86400",
            Urgency: "high",
          },
        });
        // Push service says this subscription no longer exists —
        // clean up so we stop paying for dead sends.
        if (res.status === 404 || res.status === 410) {
          await db
            .prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
            .bind(endpoint)
            .run();
        }
      } catch {
        /* network error — try again on the next event */
      }
    }),
  );
}
