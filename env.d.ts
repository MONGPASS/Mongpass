// Type declarations for Cloudflare bindings + env vars accessed via
// `getRequestContext().env` from Edge Runtime route handlers.
// This file is auto-imported by TypeScript (no explicit import needed).

import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    /** D1 database — relational data (users, shops, orders, …) */
    DB: D1Database;
    /** R2 bucket — image storage (presigned uploads from clients) */
    IMAGES: R2Bucket;
    /** Google OAuth credentials */
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    /** Comma-separated email allowlist; matching users get role='admin' on first sign-in */
    ADMIN_EMAILS: string;
    /** Random 32-byte secret used by the session module (HMAC etc.) */
    AUTH_SECRET: string;
  }
}

export {};
