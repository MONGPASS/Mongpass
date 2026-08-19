'use client';

/**
 * Browser-side Web Push enrolment. Drives the "Мэдэгдэл асаах" button
 * on /biz: permission prompt → service-worker registration →
 * pushManager subscription → POST to /api/push/subscribe.
 */

export type PushStatus =
  | "unsupported"   // browser has no Push API (or push isn't configured server-side)
  | "denied"        // user blocked notifications
  | "subscribed"
  | "not-subscribed";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function fetchPublicKey(): Promise<string | null> {
  try {
    const res = await fetch("/api/push/public-key");
    if (!res.ok) return null;
    const data = (await res.json()) as { publicKey?: string };
    return data.publicKey || null;
  } catch {
    return null;
  }
}

/** Current enrolment state — drives the button label. */
export async function getPushStatus(): Promise<PushStatus> {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const publicKey = await fetchPublicKey();
  if (!publicKey) return "unsupported"; // server has no VAPID keys yet
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "subscribed" : "not-subscribed";
}

/**
 * Full enrolment flow. Returns the resulting status; "denied" and
 * "unsupported" are terminal — the UI should explain, not retry.
 */
export async function enablePush(): Promise<PushStatus> {
  if (!pushSupported()) return "unsupported";
  const publicKey = await fetchPublicKey();
  if (!publicKey) return "unsupported";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
    }));

  const json = sub.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
  });
  if (!res.ok) {
    // Server rejected (signed out?) — drop the browser-side sub so the
    // state doesn't look enabled when the server will never send.
    await sub.unsubscribe().catch(() => {});
    return "not-subscribed";
  }
  return "subscribed";
}

/** Tear down both the browser subscription and the server row. */
export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}
