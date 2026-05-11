'use client';

import { MessageCircle } from "lucide-react";
import { parseTimestamp } from "@/lib/datetime";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChatThread, loadThreadsForShop } from "@/lib/chatStore";

function fmtRelative(iso: string): string {
  const diff = Date.now() - parseTimestamp(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "сая";
  if (mins < 60) return `${mins} мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} цаг`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}хн`;
  return parseTimestamp(iso).toLocaleDateString("mn-MN");
}

/**
 * Lists customer chat threads for the shop currently being managed.
 * Each row links to the universal /chat/[threadId] page, which handles
 * both customer and shop-owner views by inferring "side" from the
 * current user's relationship to the thread.
 */
export function BizChatThreadList({ shopId }: { shopId: string }) {
  const [threads, setThreads] = useState<ChatThread[]>([]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const list = await loadThreadsForShop(shopId);
      if (active) setThreads(list);
    };
    refresh();
    // Light polling so a customer's new message shows up while the shop
    // owner is on this screen.
    const interval = setInterval(refresh, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [shopId]);

  return (
    <div className="bg-white mt-2 border-y border-gray-100">
      <div className="px-5 pt-4 pb-2">
        <h3 className="font-bold text-gray-900 text-[16px]">Чат жагсаалт</h3>
      </div>
      {threads.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
            <MessageCircle className="w-5 h-5" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Чат хараахан байхгүй байна</p>
          <p className="text-[12px] text-gray-400">
            Үйлчлүүлэгчид таны дэлгүүртэй чат эхлүүлэхэд энд гарч ирнэ
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {threads.map((t) => {
            const hasUnread = Boolean(t.unread && t.lastMessagePreview);
            return (
              <Link
                key={t.id}
                href={`/chat/${encodeURIComponent(t.id)}`}
                className="flex items-center gap-3 px-5 py-3.5 active:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                  {t.userName.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-[14px] truncate ${hasUnread ? "font-extrabold text-gray-900" : "font-bold text-gray-900"}`}>
                      {t.userName}
                    </p>
                    <span className={`text-[11px] shrink-0 ml-2 ${hasUnread ? "text-primary font-semibold" : "text-gray-400"}`}>
                      {fmtRelative(t.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-[12px] truncate flex-1 ${hasUnread ? "text-gray-900 font-semibold" : "text-gray-500"}`}>
                      {t.lastMessagePreview || (
                        <span className="italic text-gray-400">Шинэ чат</span>
                      )}
                    </p>
                    {hasUnread && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" aria-label="Шинэ мессеж" />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
