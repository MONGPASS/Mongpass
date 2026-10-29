import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadSource(path) {
  const source = await readFile(new URL("../" + path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  });
  return import(
    "data:text/javascript;base64," + Buffer.from(outputText).toString("base64")
  );
}
const { createBusinessDemoState, businessPreviewRequest, demoOverview } =
  await loadSource("src/lib/admin/businessPreview.ts");
const { businessPreviewHref } = await loadSource(
  "src/lib/admin/previewNavigation.ts",
);
const fixture = {
  generatedAt: "2026-10-22T02:00:00Z",
  days: 7,
  shop: {
    id: "sample-business",
    ownerId: "sample-owner",
    name: "Demo restaurant",
    category: "restaurant",
    status: "approved",
    isOpen: true,
    createdAt: "2026-10-22T02:00:00Z",
  },
  totals: {
    orders: 284,
    chats: 68,
    favorites: 152,
    reviews: 38,
    pending: 5,
    unread: 3,
    rating: 4.8,
    unreplied: 2,
  },
  daily: [],
  recentOrders: [],
};
const fresh = () => createBusinessDemoState(structuredClone(fixture));
const write = (state, path, method, body) =>
  businessPreviewRequest(state, path, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

test("business preview: every owner menu stays in the demo and preserves search parameters", () => {
  for (const route of [
    "orders",
    "chat",
    "reviews",
    "menu",
    "notices",
    "profile",
  ]) {
    assert.equal(businessPreviewHref("/biz/" + route), "/preview/biz/" + route);
  }
  assert.equal(
    businessPreviewHref("/biz/orders?q=DEMO-001"),
    "/preview/biz/orders?q=DEMO-001",
  );
  assert.equal(businessPreviewHref("/biz"), "/preview/biz");
  assert.equal(
    businessPreviewHref("/chat/demo-thread-1"),
    "/preview/biz/chat?thread=demo-thread-1",
  );
  assert.equal(
    businessPreviewHref("/category/restaurant/sample-business"),
    "/preview/biz/store",
  );
});

test("business preview: real account and unknown requests fail without touching network or state", () => {
  const state = fresh();
  const before = structuredClone(state);
  for (const path of [
    "https://example.com/api/shops",
    "/api/auth/me",
    "/api/admin/users",
    "/api/shops/real-shop/menu",
    "/api/orders/real-order/status",
  ]) {
    assert.throws(() => write(state, path, "POST", { status: "received" }));
  }
  assert.deepEqual(state, before);
});

test("business preview: menu create/edit/delete works and survives a storage round trip", () => {
  const initial = fresh();
  const created = write(initial, "/api/shops/sample-business/menu", "POST", {
    name: "Preview meal",
    category: "Main",
    price: "9000",
    desc: "Sample",
  });
  assert.equal(initial.menu.length, 3);
  assert.equal(created.next.menu.length, 4);
  const restored = JSON.parse(JSON.stringify(created.next));
  const id = created.data.item.id;
  const edited = write(
    restored,
    "/api/shops/sample-business/menu/" + id,
    "PATCH",
    { price: "11000" },
  );
  const list = businessPreviewRequest(
    edited.next,
    "/api/shops/sample-business/menu",
  ).data.items;
  assert.equal(list.find((item) => item.id === id).price, "11000");
  const removed = write(
    edited.next,
    "/api/shops/sample-business/menu/" + id,
    "DELETE",
  );
  assert.equal(removed.next.menu.length, 3);
  assert.equal(fresh().menu.length, 3);
});

test("business preview: order status and review replies update the home task counts", () => {
  const initial = fresh();
  const changed = write(
    initial,
    "/api/orders/" + initial.orders[0].id + "/status",
    "POST",
    { status: "received" },
  );
  assert.equal(demoOverview(changed.next).totals.pending, 4);
  assert.equal(demoOverview(initial).totals.pending, 5);
  const replied = write(
    changed.next,
    "/api/reviews/" + initial.reviews[0].id + "/reply",
    "POST",
    { reply: "Thank you!" },
  );
  assert.equal(demoOverview(replied.next).totals.unreplied, 1);
  const removed = write(
    replied.next,
    "/api/reviews/" + initial.reviews[0].id + "/reply",
    "DELETE",
  );
  assert.equal(demoOverview(removed.next).totals.unreplied, 2);
});

test("business preview: reading and sending demo messages never needs a login", () => {
  const initial = fresh();
  const thread = initial.threads[0];
  const read = businessPreviewRequest(
    initial,
    "/api/chat/threads/" + thread.id + "/messages",
  );
  assert.equal(demoOverview(read.next).totals.unread, 2);
  const sent = write(
    read.next,
    "/api/chat/threads/" + thread.id + "/messages",
    "POST",
    { text: "Open until 22:00." },
  );
  assert.equal(sent.data.messages.length, 2);
  assert.equal(sent.data.messages.at(-1).from, "shop");
  assert.equal(sent.next.threads[0].lastMessagePreview, "Open until 22:00.");
});

test("business preview: profile edits cannot change identity, role, or approval status", () => {
  const initial = fresh();
  const changed = write(initial, "/api/shops/sample-business", "PATCH", {
    name: "Updated demo",
    role: "admin",
    ownerId: "attacker",
    status: "rejected",
  });
  assert.equal(changed.next.overview.shop.name, "Updated demo");
  assert.equal(changed.next.overview.shop.ownerId, "sample-owner");
  assert.equal(changed.next.overview.shop.status, "approved");
  assert.equal(changed.next.overview.shop.role, undefined);
  const closed = write(
    changed.next,
    "/api/shops/sample-business/toggle-open",
    "POST",
  );
  assert.equal(demoOverview(closed.next).shop.isOpen, false);
});
