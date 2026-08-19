/**
 * End-to-end API tests.
 *
 * Boots the real `next dev` server against the local D1 database
 * (both wrangler's CLI and setupDevPlatform persist to
 * .wrangler/state/v3, so migrations + seeds land where the server
 * reads), seeds two throwaway accounts, and exercises the contracts
 * that keep money and permissions honest:
 *
 *   - order creation error codes (unauthenticated / invalid /
 *     not-approved / closed / success)
 *   - shop category allowlist
 *   - reviews: shopId required, keyset page shape
 *   - reports: dedupe, admin-only queue
 *   - bans: permission guards, immediate session invalidation
 *   - badges: signed-out zeros
 *
 * Run via `npm run test:api`. Startup costs ~30-60s (Next compiles
 * routes lazily), so it's a separate script from the fast unit tests.
 */

import assert from "node:assert/strict";
import { spawn, execFileSync, execSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, before, after } from "node:test";

const PORT = 4611 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Throwaway identities — ids are namespaced so teardown can sweep them
// without touching a developer's own local data.
const RUN = randomUUID().slice(0, 8);
const ADMIN = {
  id: `usr-e2e-admin-${RUN}`,
  email: `e2e-admin-${RUN}@example.com`,
  token: `e2eadmintoken${RUN}aaaaaaaaaaaaaaaa`,
};
const MEMBER = {
  id: `usr-e2e-member-${RUN}`,
  email: `e2e-member-${RUN}@example.com`,
  token: `e2emembertoken${RUN}aaaaaaaaaaaaaaa`,
};

const sha256hex = (s) => createHash("sha256").update(s).digest("hex");
const cookie = (t) => ({ Cookie: `mongpass_session=${t}` });

let server = null;
let tmp = null;

function d1(sql) {
  const file = join(tmp, `q-${Date.now()}-${Math.random().toString(36).slice(2)}.sql`);
  writeFileSync(file, sql);
  execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["wrangler", "d1", "execute", "mongpass", "--local", "--file", file],
    { cwd: ROOT, stdio: "pipe", shell: process.platform === "win32" },
  );
}

async function waitForServer(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/auth/me`);
      if (res.status === 200) return;
      lastErr = new Error(`status ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`dev server never became ready: ${lastErr}`);
}

async function api(path, { method = "GET", token = null, body = null } = {}) {
  const headers = { ...(token ? cookie(token) : {}) };
  if (body !== null) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== null ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }
  return { status: res.status, json };
}

before(async () => {
  tmp = mkdtempSync(join(tmpdir(), "mongpass-e2e-"));

  // CI has no .dev.vars — the example file is enough for the routes
  // under test (they only need the D1/R2 bindings, not OAuth).
  if (!existsSync(join(ROOT, ".dev.vars"))) {
    copyFileSync(join(ROOT, ".dev.vars.example"), join(ROOT, ".dev.vars"));
  }

  // Schema up to date, then seed the two accounts + sessions.
  execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["wrangler", "d1", "migrations", "apply", "mongpass", "--local"],
    { cwd: ROOT, stdio: "pipe", shell: process.platform === "win32" },
  );
  const far = Date.now() + 24 * 3600 * 1000;
  d1(
    [
      `INSERT OR REPLACE INTO users (id, email, name, role) VALUES ('${ADMIN.id}', '${ADMIN.email}', 'E2E Admin', 'admin');`,
      `INSERT OR REPLACE INTO users (id, email, name, role) VALUES ('${MEMBER.id}', '${MEMBER.email}', 'E2E Member', 'user');`,
      `INSERT OR REPLACE INTO sessions (id, user_id, expires_at) VALUES ('${sha256hex(ADMIN.token)}', '${ADMIN.id}', ${far});`,
      `INSERT OR REPLACE INTO sessions (id, user_id, expires_at) VALUES ('${sha256hex(MEMBER.token)}', '${MEMBER.id}', ${far});`,
    ].join("\n"),
  );

  server = spawn(
    process.execPath,
    [join(ROOT, "node_modules", "next", "dist", "bin", "next"), "dev"],
    {
      cwd: ROOT,
      env: { ...process.env, PORT: String(PORT), NODE_ENV: "development" },
      stdio: "ignore",
    },
  );
  await waitForServer();
});

after(() => {
  try {
    d1(
      [
        `DELETE FROM shops WHERE owner_id IN ('${ADMIN.id}', '${MEMBER.id}');`,
        `DELETE FROM reports WHERE reporter_id IN ('${ADMIN.id}', '${MEMBER.id}');`,
        `DELETE FROM community_posts WHERE author_id IN ('${ADMIN.id}', '${MEMBER.id}');`,
        `DELETE FROM users WHERE id IN ('${ADMIN.id}', '${MEMBER.id}');`,
      ].join("\n"),
    );
  } catch {
    /* teardown is best-effort */
  }
  if (server) {
    if (process.platform === "win32") {
      try {
        execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
      } catch {
        /* already gone */
      }
    } else {
      server.kill("SIGTERM");
    }
  }
});

// ===================== Orders =====================

test("orders: unauthenticated POST is rejected with a typed code", async () => {
  const r = await api("/api/orders", {
    method: "POST",
    body: { shopId: "x", shopCategory: "meat" },
  });
  assert.equal(r.status, 401);
  assert.equal(r.json.code, "unauthenticated");
});

test("orders: missing fields is a 400 with code invalid", async () => {
  const r = await api("/api/orders", {
    method: "POST",
    token: MEMBER.token,
    body: {},
  });
  assert.equal(r.status, 400);
  assert.equal(r.json.code, "invalid");
});

test("orders: unknown shop is a 404 with code shop_not_found", async () => {
  const r = await api("/api/orders", {
    method: "POST",
    token: MEMBER.token,
    body: { shopId: "shop-does-not-exist", shopCategory: "meat" },
  });
  assert.equal(r.status, 404);
  assert.equal(r.json.code, "shop_not_found");
});

test("orders: lifecycle — pending shop 409, closed shop 409, open shop 201", async () => {
  // Admin registers a shop (starts pending).
  const created = await api("/api/shops", {
    method: "POST",
    token: ADMIN.token,
    body: { category: "meat", name: `E2E Shop ${RUN}` },
  });
  assert.equal(created.status, 201);
  const shopId = created.json.shop.id;
  const orderBody = {
    shopId,
    shopCategory: "meat",
    items: [{ productId: "p", category: "c", name: "n", price: "1000", unit: "kg", qty: 1 }],
    subtotalAmount: 1000,
    deliveryFee: 0,
    totalAmount: 1000,
    bankAccountSnapshot: "KB",
    customer: { name: "T", phone: "010", address: "Seoul" },
  };

  const vsPending = await api("/api/orders", { method: "POST", token: MEMBER.token, body: orderBody });
  assert.equal(vsPending.status, 409);
  assert.equal(vsPending.json.code, "shop_not_approved");

  const approve = await api(`/api/shops/${shopId}/approve`, { method: "POST", token: ADMIN.token, body: {} });
  assert.equal(approve.status, 200);

  const close = await api(`/api/shops/${shopId}/toggle-open`, { method: "POST", token: ADMIN.token, body: {} });
  assert.equal(close.json.shop.isOpen, false);
  const vsClosed = await api("/api/orders", { method: "POST", token: MEMBER.token, body: orderBody });
  assert.equal(vsClosed.status, 409);
  assert.equal(vsClosed.json.code, "shop_closed");

  await api(`/api/shops/${shopId}/toggle-open`, { method: "POST", token: ADMIN.token, body: {} });
  const ok = await api("/api/orders", { method: "POST", token: MEMBER.token, body: orderBody });
  assert.equal(ok.status, 201);
  assert.equal(ok.json.order.status, "pending");

  // Owner sees it in the badge count; a stranger's shopId query is forbidden.
  const badge = await api("/api/me/badges", { token: ADMIN.token });
  assert.ok(badge.json.bizPendingOrders >= 1);
  const strangerList = await api(`/api/orders?shopId=${shopId}`, { token: MEMBER.token });
  assert.equal(strangerList.status, 403);
});

test("orders: keyset pagination returns disjoint pages", async () => {
  const p1 = await api("/api/orders?mine=true&limit=1", { token: MEMBER.token });
  assert.equal(p1.status, 200);
  if (p1.json.nextCursor) {
    const p2 = await api(
      `/api/orders?mine=true&limit=1&cursor=${encodeURIComponent(p1.json.nextCursor)}`,
      { token: MEMBER.token },
    );
    const ids1 = new Set(p1.json.orders.map((o) => o.id));
    for (const o of p2.json.orders) assert.ok(!ids1.has(o.id));
  }
});

// ===================== Shops =====================

test("shops: category allowlist rejects junk", async () => {
  const r = await api("/api/shops", {
    method: "POST",
    token: MEMBER.token,
    body: { category: "not-a-category", name: "Bad" },
  });
  assert.equal(r.status, 400);
});

// ===================== Reviews =====================

test("reviews: shopId is required", async () => {
  const r = await api("/api/reviews");
  assert.equal(r.status, 400);
});

test("reviews: page shape carries nextCursor", async () => {
  const r = await api("/api/reviews?shopId=nonexistent");
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.reviews));
  assert.ok("nextCursor" in r.json);
});

// ===================== Reports =====================

test("reports: member can file, cannot read the queue; dedupe is silent", async () => {
  const post = await api("/api/community/posts", {
    method: "POST",
    token: MEMBER.token,
    body: { category: "Бусад", title: `e2e ${RUN}`, content: "x" },
  });
  assert.equal(post.status, 201);
  const postId = post.json.post.id;

  const first = await api("/api/reports", {
    method: "POST",
    token: MEMBER.token,
    body: { targetType: "post", targetId: postId, reason: "spam" },
  });
  assert.equal(first.status, 201);
  const dup = await api("/api/reports", {
    method: "POST",
    token: MEMBER.token,
    body: { targetType: "post", targetId: postId, reason: "spam again" },
  });
  assert.equal(dup.status, 201);

  const memberQueue = await api("/api/reports", { token: MEMBER.token });
  assert.equal(memberQueue.status, 403);

  const adminQueue = await api("/api/reports", { token: ADMIN.token });
  assert.equal(adminQueue.status, 200);
  const mine = adminQueue.json.reports.filter((x) => x.targetId === postId);
  assert.equal(mine.length, 1); // dedupe held
  assert.equal(mine[0].targetPreview, `e2e ${RUN}`); // enrichment works
});

// ===================== Bans =====================

test("bans: guards hold and a banned session dies immediately", async () => {
  const memberBans = await api(`/api/users/${ADMIN.id}/ban`, {
    method: "POST",
    token: MEMBER.token,
    body: { banned: true },
  });
  assert.equal(memberBans.status, 403);

  const adminBansAdmin = await api(`/api/users/${ADMIN.id}/ban`, {
    method: "POST",
    token: ADMIN.token,
    body: { banned: true },
  });
  assert.equal(adminBansAdmin.status, 409);

  const ban = await api(`/api/users/${MEMBER.id}/ban`, {
    method: "POST",
    token: ADMIN.token,
    body: { banned: true, reason: "e2e" },
  });
  assert.equal(ban.status, 200);

  const dead = await api("/api/auth/me", { token: MEMBER.token });
  assert.equal(dead.json.user, null);

  const unban = await api(`/api/users/${MEMBER.id}/ban`, {
    method: "POST",
    token: ADMIN.token,
    body: { banned: false },
  });
  assert.equal(unban.status, 200);
});

// ===================== Badges =====================

test("badges: signed-out callers get zeros, not an error", async () => {
  const r = await api("/api/me/badges");
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { chatUnread: 0, bizPendingOrders: 0 });
});
