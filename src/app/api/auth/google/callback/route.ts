/**
 * Handle Google's redirect after the user authorizes the app:
 *  1. Validate state + PKCE verifier from the cookies set in /api/auth/google
 *  2. Exchange the auth code for tokens
 *  3. Fetch the user's profile from Google
 *  4. Find or create the corresponding row in `users`
 *     (with role='admin' if their email is in ADMIN_EMAILS)
 *  5. Mint a session token, set the cookie, redirect back where they came from
 */

export const runtime = "edge";

import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { OAuth2RequestError, ArcticFetchError } from "arctic";
import { fetchGoogleUserInfo, getGoogleClient } from "@/lib/auth/google";
import {
  createSession,
  generateSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";

const STATE_COOKIE = "mongpass_oauth_state";
const CODE_VERIFIER_COOKIE = "mongpass_oauth_verifier";
const POST_LOGIN_REDIRECT_COOKIE = "mongpass_post_login";

function clearOauthCookies(cookieStore: ReturnType<typeof cookies>): void {
  for (const name of [STATE_COOKIE, CODE_VERIFIER_COOKIE, POST_LOGIN_REDIRECT_COOKIE]) {
    cookieStore.set(name, "", { path: "/", maxAge: 0 });
  }
}

function isAdminEmail(env: CloudflareEnv, email: string): boolean {
  const list = (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateFromQuery = url.searchParams.get("state");

  const cookieStore = cookies();
  const stateFromCookie = cookieStore.get(STATE_COOKIE)?.value ?? null;
  const codeVerifier = cookieStore.get(CODE_VERIFIER_COOKIE)?.value ?? null;
  const postLoginRedirect =
    cookieStore.get(POST_LOGIN_REDIRECT_COOKIE)?.value ?? "/";

  if (!code || !stateFromQuery || !stateFromCookie || !codeVerifier) {
    clearOauthCookies(cookieStore);
    return new Response("Missing OAuth state. Please try again.", { status: 400 });
  }
  if (stateFromQuery !== stateFromCookie) {
    clearOauthCookies(cookieStore);
    return new Response("Invalid OAuth state. Possible CSRF — try again.", {
      status: 400,
    });
  }

  const { env } = getRequestContext();
  const cfEnv = env as unknown as CloudflareEnv;
  const google = getGoogleClient(cfEnv, url.origin);

  let tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch (err) {
    clearOauthCookies(cookieStore);
    if (err instanceof OAuth2RequestError) {
      return new Response(`Google rejected the code: ${err.message}`, { status: 400 });
    }
    if (err instanceof ArcticFetchError) {
      return new Response("Network error talking to Google. Please try again.", {
        status: 502,
      });
    }
    throw err;
  }

  const profile = await fetchGoogleUserInfo(tokens.accessToken());
  if (!profile.email_verified) {
    clearOauthCookies(cookieStore);
    return new Response("Your Google email is not verified.", { status: 403 });
  }

  const db = cfEnv.DB;

  // Look up by oauth_accounts (provider, provider_user_id) first; fall
  // back to users.email so existing rows are matched if a user signed
  // in via a different flow earlier.
  const existing = await db
    .prepare(
      `SELECT u.id AS user_id, u.email, u.role
         FROM oauth_accounts oa
         JOIN users u ON u.id = oa.user_id
        WHERE oa.provider = 'google' AND oa.provider_user_id = ?`,
    )
    .bind(profile.sub)
    .first<{ user_id: string; email: string; role: "user" | "admin" }>();

  let userId: string;
  if (existing) {
    userId = existing.user_id;
  } else {
    // Try to merge with an existing user by email (covers the case where
    // somebody is added to ADMIN_EMAILS but had a row from a previous flow).
    const byEmail = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(profile.email)
      .first<{ id: string }>();

    if (byEmail) {
      userId = byEmail.id;
      await db
        .prepare(
          "INSERT INTO oauth_accounts (provider, provider_user_id, user_id) VALUES (?, ?, ?)",
        )
        .bind("google", profile.sub, userId)
        .run();
    } else {
      userId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const role = isAdminEmail(cfEnv, profile.email) ? "admin" : "user";
      await db
        .prepare(
          `INSERT INTO users (id, email, name, image_url, role)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(userId, profile.email, profile.name, profile.picture ?? null, role)
        .run();
      await db
        .prepare(
          "INSERT INTO oauth_accounts (provider, provider_user_id, user_id) VALUES (?, ?, ?)",
        )
        .bind("google", profile.sub, userId)
        .run();
    }
  }

  // Promote-on-sign-in: if an existing user's email is in ADMIN_EMAILS
  // but their row says role='user', upgrade them. Lets you grant admin
  // by editing the env var without touching the DB. Symmetric demotion
  // is intentionally NOT done — removing from the env var doesn't
  // automatically demote, to avoid accidental lockouts during config
  // reloads.
  if (isAdminEmail(cfEnv, profile.email)) {
    await db
      .prepare("UPDATE users SET role = 'admin' WHERE id = ? AND role = 'user'")
      .bind(userId)
      .run();
  }

  // Mint session and set cookie
  const token = generateSessionToken();
  const session = await createSession(db, token, userId);

  // Build redirect response and attach cookies
  const safeRedirect = postLoginRedirect.startsWith("/") ? postLoginRedirect : "/";
  const response = Response.redirect(`${url.origin}${safeRedirect}`, 302);
  // We can't directly mutate the redirect response's cookies, so we
  // construct a fresh response with the same redirect headers.
  // next/headers' cookies() works for both reading the request cookies
  // AND writing response cookies in route handlers, so use it instead.
  setSessionCookie(cookies(), token, session.expiresAt);
  clearOauthCookies(cookies());
  return response;
}
