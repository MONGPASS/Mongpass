/**
 * Google OAuth 2.0 provider configuration via `arctic`.
 *
 * The redirect URI is computed per-request from the incoming URL's
 * origin so the same code works for localhost dev, the Cloudflare
 * Pages preview domain (mongpass2026.pages.dev), and the custom
 * domain (mongpass.kr) — without hardcoding any of them.
 */

import { Google } from "arctic";

export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

/** Build a Google client whose redirect URI matches `origin`. */
export function getGoogleClient(env: CloudflareEnv, origin: string): Google {
  return new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${origin}${GOOGLE_CALLBACK_PATH}`,
  );
}

/**
 * Decoded Google `userinfo` payload used during sign-up. Only the
 * fields we actually persist are typed.
 */
export interface GoogleUserInfo {
  sub: string;        // Google's stable user id
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Google userinfo failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as GoogleUserInfo;
}
