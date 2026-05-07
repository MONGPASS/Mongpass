'use client';

import {
  ArrowLeft,
  Bell,
  ShoppingBag,
  Store,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Notification,
  buildNotifications,
  getLastSeenAt,
  markAllNotificationsSeen,
} from "@/lib/notificationStore";
import { getCurrentUser, User } from "@/lib/userStore";

const ICON_BG: Record<Notification["kind"], string> = {
  "order-status": "bg-blue-100 text-blue-600",
  "new-order": "bg-orange-100 text-orange-600",
  "shop-pending": "bg-purple-100 text-purple-600",
};

function NotificationIcon({ kind }: { kind: Notification["kind"] }) {
  if (kind === "order-status") return <ShoppingBag className="w-4 h-4" />;
  if (kind === "new-order") return <Store className="w-4 h-4" />;
  return <ShieldCheck className="w-4 h-4" />;
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Дөнгөж сая";
  if (mins < 60) return `${mins} мин өмнө`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} цагийн өмнө`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} өдрийн өмнө`;
  return new Date(iso).toLocaleDateString("mn-MN");
}

export default function NotificationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Notification[]>([]);
  const [lastSeenMs, setLastSeenMs] = useState(0);

  useEffect(() => {
    let active = true;
    getCurrentUser().then((u) => {
      if (!active) return;
      setUser(u);
      setItems(buildNotifications(u));
      const seen = getLastSeenAt(u?.id ?? null);
      setLastSeenMs(seen ? new Date(seen).getTime() : 0);
      // Mark as read when the page is opened
      markAllNotificationsSeen(u?.id ?? null);
    });
    return () => { active = false; };
  }, []);

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-12">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Мэдэгдэл</h1>
        </div>
      </header>

      {!user ? (
        <div className="px-4 pt-12 text-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 text-gray-400">
            <Bell className="w-5 h-5" />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Мэдэгдэл харахын тулд нэвтрэх шаардлагатай
          </p>
          <Link
            href="/login?redirect=/notifications"
            className="inline-block bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            Нэвтрэх
          </Link>
        </div>
      ) : items.length === 0 ? (
        <div className="px-4 pt-12 text-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 text-gray-400">
            <Bell className="w-5 h-5" />
          </div>
          <p className="text-sm text-gray-500">Мэдэгдэл байхгүй байна</p>
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-2">
          {items.map((n) => {
            const unread = new Date(n.createdAt).getTime() > lastSeenMs;
            return (
              <Link
                key={n.id}
                href={n.href}
                className={`block rounded-2xl shadow-sm p-3 ${
                  unread ? "bg-blue-50/60 border border-blue-200" : "bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ICON_BG[n.kind]}`}
                  >
                    <NotificationIcon kind={n.kind} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-bold text-[13px] text-gray-900 truncate">{n.title}</p>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {fmtRelative(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-600 line-clamp-2">{n.body}</p>
                  </div>
                  {unread && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
