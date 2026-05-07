/**
 * Direct chat between a customer (User) and a shop. Threads are
 * uniquely identified by `${userId}:${shopId}`, so each user-shop pair
 * has exactly one conversation that both sides see.
 *
 * For the demo this is localStorage; swapping to a real backend means
 * replacing load/save with fetch and wiring polling/SSE for live
 * updates. The UI components don't need to change.
 */

export interface ChatThread {
  id: string;                  // `${userId}:${shopId}`
  userId: string;              // customer
  shopId: string;
  /** Snapshot for fast list rendering. Both sides keep them in sync. */
  shopName: string;
  userName: string;
  lastMessageAt: string;       // ISO
  lastMessagePreview: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  from: "user" | "shop";
  text: string;
  createdAt: string;
}

const THREADS_KEY = "mongpass:chat:threads:v1";
const MESSAGES_KEY = "mongpass:chat:messages:v1";

function loadAllThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(THREADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAllThreads(threads: ChatThread[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
}

function loadAllMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAllMessages(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function threadIdFor(userId: string, shopId: string): string {
  return `${userId}:${shopId}`;
}

export function findThread(threadId: string): ChatThread | null {
  return loadAllThreads().find((t) => t.id === threadId) ?? null;
}

/**
 * Get-or-create a thread for this user-shop pair. Snapshots the
 * up-to-date shop/user names so the chat list shows the current names.
 */
export function ensureThread(input: {
  userId: string;
  userName: string;
  shopId: string;
  shopName: string;
}): ChatThread {
  const id = threadIdFor(input.userId, input.shopId);
  const all = loadAllThreads();
  const existing = all.find((t) => t.id === id);
  if (existing) {
    // Refresh snapshots in case names changed
    const updated: ChatThread = {
      ...existing,
      userName: input.userName,
      shopName: input.shopName,
    };
    saveAllThreads(all.map((t) => (t.id === id ? updated : t)));
    return updated;
  }
  const thread: ChatThread = {
    id,
    userId: input.userId,
    userName: input.userName,
    shopId: input.shopId,
    shopName: input.shopName,
    lastMessageAt: new Date().toISOString(),
    lastMessagePreview: "",
  };
  saveAllThreads([thread, ...all]);
  return thread;
}

export function loadMessagesForThread(threadId: string): ChatMessage[] {
  return loadAllMessages()
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function newMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function sendMessage(input: {
  threadId: string;
  from: "user" | "shop";
  text: string;
}): ChatMessage {
  const message: ChatMessage = {
    id: newMessageId(),
    threadId: input.threadId,
    from: input.from,
    text: input.text,
    createdAt: new Date().toISOString(),
  };
  saveAllMessages([...loadAllMessages(), message]);
  // Update thread snapshot so the list page shows the latest preview
  const threads = loadAllThreads();
  const idx = threads.findIndex((t) => t.id === input.threadId);
  if (idx >= 0) {
    threads[idx] = {
      ...threads[idx],
      lastMessageAt: message.createdAt,
      lastMessagePreview: input.text.slice(0, 80),
    };
    saveAllThreads(threads);
  }
  return message;
}

/** Threads where this user is the customer. Newest first. */
export function loadThreadsForUser(userId: string): ChatThread[] {
  return loadAllThreads()
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

/** Threads for shops the user owns. Used by /biz Чат tab. */
export function loadThreadsForShop(shopId: string): ChatThread[] {
  return loadAllThreads()
    .filter((t) => t.shopId === shopId)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}
