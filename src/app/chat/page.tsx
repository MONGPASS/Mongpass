'use client';

import { LogIn, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { ChatThread, loadThreadsForUser } from "@/lib/chatStore";
import { User, getCurrentUser } from "@/lib/userStore";
import { Shop, findShopById } from "@/lib/shopStore";
import { r2Url } from "@/lib/images/upload";

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "сая";
  if (mins < 60) return `${mins} мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} цаг`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}хн`;
  return new Date(iso).toLocaleDateString("mn-MN");
}

export default function ChatListPage() {
  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  // Preload the shops referenced by every thread so the row render
  // below stays sync (it can't `await findShopById` per item).
  const [shopsById, setShopsById] = useState<Map<string, Shop>>(new Map());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const u = await getCurrentUser();
      if (!active) return;
      setUser(u);
      if (u) {
        const ts = loadThreadsForUser(u.id);
        setThreads(ts);
        const uniqueShopIds = Array.from(new Set(ts.map((t) => t.shopId)));
        const fetched = await Promise.all(uniqueShopIds.map((id) => findShopById(id)));
        if (!active) return;
        const map = new Map<string, Shop>();
        for (const s of fetched) if (s) map.set(s.id, s);
        setShopsById(map);
      }
      setLoaded(true);
    })();
    return () => { active = false; };
  }, []);

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-[80px]">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-5 py-4">
          <h1 className="text-[18px] font-bold text-gray-900">Чат</h1>
        </div>
      </header>

      {!loaded ? null : !user ? (
        <div className="px-5 py-16 text-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 text-gray-400">
            <MessageCircle className="w-5 h-5" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Чат харахын тулд нэвтрэх шаардлагатай</p>
          <Link
            href="/login?redirect=/chat"
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            <LogIn className="w-4 h-4" /> Нэвтрэх
          </Link>
        </div>
      ) : threads.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 text-gray-400">
            <MessageCircle className="w-5 h-5" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Чат хараахан байхгүй байна</p>
          <p className="text-[12px] text-gray-400">Дэлгүүрийн дэлгэрэнгүй хуудаснаас &ldquo;Чатлах&rdquo; дарж эхлүүлээрэй</p>
        </div>
      ) : (
        <div className="bg-white divide-y divide-gray-100">
          {threads.map((t) => {
            const shop = shopsById.get(t.shopId) ?? null;
            const cover = r2Url(shop?.images?.[0]);
            return (
              <Link
                key={t.id}
                href={`/chat/${encodeURIComponent(t.id)}`}
                className="flex items-center gap-3 px-5 py-3.5 active:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0 overflow-hidden">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={t.shopName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                      {t.shopName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-bold text-[14px] text-gray-900 truncate">{t.shopName}</p>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {fmtRelative(t.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 truncate">
                    {t.lastMessagePreview || <span className="italic text-gray-400">Шинэ чат</span>}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
