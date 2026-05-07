/**
 * Begin Google OAuth: generate state + PKCE verifier, stash them in
 * short-lived httpOnly cookies, then redirect the browser to Google.
 *
 * The optional `?redirect=…` query is preserved through the round-trip
 * by encoding it into the OAuth `state` parameter so the callback can
 * route the user back where they came from.
 */

export const runtime = "edge";

import { generateState, generateCodeVerifier } from "arctic";
import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getGoogleClient } from "@/lib/auth/google";

const STATE_COOKIE = "mongpass_oauth_state";
const CODE_VERIFIER_COOKIE = "mongpass_oauth_verifier";
const POST_LOGIN_REDIRECT_COOKIE = "mongpass_post_login";
const COOKIE_MAX_AGE_SEC = 60 * 10; // 10 minutes — generous, but limited

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const postLoginRedirect = url.searchParams.get("redirect") ?? "/";

  const { env } = getRequestContext();
  const google = getGoogleClient(env as unknown as CloudflareEnv, url.origin);

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const authUrl = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "email",
    "profile",
  ]);

  const cookieStore = cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  };
  cookieStore.set(STATE_COOKIE, state, cookieOpts);
  cookieStore.set(CODE_VERIFIER_COOKIE, codeVerifier, cookieOpts);
  cookieStore.set(POST_LOGIN_REDIRECT_COOKIE, postLoginRedirect, cookieOpts);

  return Response.redirect(authUrl.toString(), 302);
}
