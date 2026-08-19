/**
 * Client for GET /api/me/badges — the single endpoint behind every
 * polled red-dot count (chat unread, pending shop orders). Surfaces
 * that used to poll separate endpoints share this one so each poll
 * tick costs exactly one request.
 */

export interface Badges {
  /** Chat threads with unread activity, across both sides the user occupies. */
  chatUnread: number;
  /** Orders in 'pending' against any shop the user owns. */
  bizPendingOrders: number;
}

const ZERO: Badges = { chatUnread: 0, bizPendingOrders: 0 };

/** Never throws — badge polling should degrade to "no dots", not error. */
export async function loadBadges(): Promise<Badges> {
  try {
    const res = await fetch("/api/me/badges", { credentials: "same-origin" });
    if (!res.ok) return ZERO;
    const data = (await res.json()) as Partial<Badges> | null;
    return {
      chatUnread: data?.chatUnread ?? 0,
      bizPendingOrders: data?.bizPendingOrders ?? 0,
    };
  } catch {
    return ZERO;
  }
}
