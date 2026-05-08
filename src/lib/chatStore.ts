/**
 * Chat store — backed by /api/chat/threads/* (D1).
 *
 * Threads are uniquely identified by `${userId}:${shopId}`, which the
 * server reconstructs from the session for POST/messages endpoints —
 * clients can't fake the identity.
 */

export interface ChatThread {
  id: string;
  userId: string;
  shopId: string;
  shopName: string;
  userName: string;
  lastMessageAt: string;
  lastMessagePreview: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  from: "user" | "shop";
  text: string;
  createdAt: string;
}

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export function threadIdFor(userId: string, shopId: string): string {
  return `${userId}:${shopId}`;
}

/** Get-or-create a thread for the current user + given shop. */
export async function ensureThread(input: {
  userId: string;
  userName: string;
  shopId: string;
  shopName: string;
}): Promise<ChatThread | null> {
  // userId/userName/shopName params are kept for backwards source-compat;
  // the server derives the user from the session and the shop name from DB.
  void input.userId;
  void input.userName;
  void input.shopName;
  const data = await postJson<{ thread: ChatThread }>("/api/chat/threads", {
    shopId: input.shopId,
  });
  return data?.thread ?? null;
}

export async function findThread(threadId: string): Promise<ChatThread | null> {
  const data = await getJson<{ thread: ChatThread }>(
    `/api/chat/threads/${encodeURIComponent(threadId)}`,
  );
  return data?.thread ?? null;
}

export async function loadMessagesForThread(
  threadId: string,
): Promise<ChatMessage[]> {
  const data = await getJson<{ messages: ChatMessage[] }>(
    `/api/chat/threads/${encodeURIComponent(threadId)}/messages`,
  );
  return data?.messages ?? [];
}

export async function sendMessage(input: {
  threadId: string;
  from: "user" | "shop";
  text: string;
}): Promise<ChatMessage | null> {
  // `from` is determined server-side from the caller's relationship to
  // the thread; the param is ignored but kept for source compat.
  void input.from;
  const data = await postJson<{ message: ChatMessage }>(
    `/api/chat/threads/${encodeURIComponent(input.threadId)}/messages`,
    { text: input.text },
  );
  return data?.message ?? null;
}

export async function loadThreadsForUser(userId: string): Promise<ChatThread[]> {
  // The server uses the session to scope; userId is unused here.
  void userId;
  const data = await getJson<{ threads: ChatThread[] }>(
    "/api/chat/threads?role=user",
  );
  return data?.threads ?? [];
}

export async function loadThreadsForShop(shopId: string): Promise<ChatThread[]> {
  // The server returns all threads for shops the caller owns, scoped
  // by session. Filter to a single shop client-side if needed.
  void shopId;
  const data = await getJson<{ threads: ChatThread[] }>(
    "/api/chat/threads?role=shop",
  );
  return data?.threads ?? [];
}
