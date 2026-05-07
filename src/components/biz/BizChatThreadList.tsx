'use client';

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChatThread, loadThreadsForShop } from "@/lib/chatStore";

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

/**
 * Lists customer chat threads for the shop currently being managed.
 * Each row links to the universal /chat/[threadId] page, which handles
 * both customer and shop-owner views by inferring "side" from the
 * current user's relationship to the thread.
 */
export function BizChatThreadList({ shopId }: { shopId: string }) {
  const [threads, setThreads] = useState<ChatThread[]>([]);

  useEffect(() => {
    setThreads(loadThreadsForShop(shopId));
    // Light polling so a customer's new message shows up while the shop
    // owner is on this screen.
    const interval = setInterval(() => {
      setThreads(loadThreadsForShop(shopId));
    }, 3000);
    return () => clearInterval(interval);
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
          {threads.map((t) => (
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
                  <p className="text-[14px] font-bold text-gray-900 truncate">{t.userName}</p>
                  <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                    {fmtRelative(t.lastMessageAt)}
                  </span>
                </div>
                <p className="text-[12px] text-gray-500 truncate">
                  {t.lastMessagePreview || (
                    <span className="italic text-gray-400">Шинэ чат</span>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
