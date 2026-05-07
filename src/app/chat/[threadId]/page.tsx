'use client';

export const runtime = "edge";

import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChatMessage,
  ChatThread,
  findThread,
  loadMessagesForThread,
  sendMessage,
} from "@/lib/chatStore";
import { User, getCurrentUser } from "@/lib/userStore";
import { findShopById } from "@/lib/shopStore";

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("mn-MN");
}

export default function ChatThreadPage({ params }: { params: { threadId: string } }) {
  const threadId = decodeURIComponent(params.threadId);
  const [thread, setThread] = useState<ChatThread | null | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Determine which side this user is — customer or shop owner.
  // For demo we infer from thread.userId vs current user. If they match,
  // user is the customer side. If user owns the shop, they're the shop side.
  const [side, setSide] = useState<"user" | "shop" | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentUser().then((u) => {
      if (!active) return;
      setUser(u);
      const t = findThread(threadId);
      setThread(t);
      if (!t || !u) return;
      setMessages(loadMessagesForThread(threadId));
      if (t.userId === u.id) {
        setSide("user");
      } else {
        const shop = findShopById(t.shopId);
        if (shop?.ownerId === u.id) setSide("shop");
      }
    });
    return () => { active = false; };
  }, [threadId]);

  // Poll every 2s for new messages so the other side's reply appears
  // without a manual refresh.
  useEffect(() => {
    if (!thread) return;
    const interval = setInterval(() => {
      setMessages(loadMessagesForThread(threadId));
    }, 2000);
    return () => clearInterval(interval);
  }, [thread, threadId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  function send() {
    if (!draft.trim() || !side) return;
    sendMessage({ threadId, from: side, text: draft.trim() });
    setDraft("");
    setMessages(loadMessagesForThread(threadId));
  }

  if (thread === undefined) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }

  if (thread === null || !user) {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <p className="text-sm text-gray-500 mb-4">Чат олдсонгүй эсвэл нэвтэрч ороогүй байна.</p>
          <Link href="/chat" className="inline-block bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
            Чат жагсаалт руу
          </Link>
        </div>
      </main>
    );
  }

  // What name to show in header — opposite side from "me"
  const otherName = side === "shop" ? thread.userName : thread.shopName;
  const shop = findShopById(thread.shopId);
  const cover = shop?.images?.[0];

  // Group consecutive messages by date for date dividers
  const grouped: Array<{ type: "date"; date: string } | { type: "msg"; msg: ChatMessage }> = [];
  let lastDate = "";
  for (const m of messages) {
    const d = fmtDate(m.createdAt);
    if (d !== lastDate) {
      grouped.push({ type: "date", date: d });
      lastDate = d;
    }
    grouped.push({ type: "msg", msg: m });
  }

  return (
    <main className="w-full h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link
            href={side === "shop" ? "/biz" : "/chat"}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={otherName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-bold">
                {otherName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate">{otherName}</p>
            {side === "shop" && (
              <p className="text-[11px] text-gray-500">Үйлчлүүлэгч</p>
            )}
          </div>
        </div>
      </header>

      {/* Messages — scrollable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Чат эхлүүлэх... мессеж бичээрэй
          </div>
        ) : (
          grouped.map((item, i) => {
            if (item.type === "date") {
              return (
                <div key={`date-${i}`} className="flex justify-center my-3">
                  <span className="text-[10px] font-semibold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
                    {item.date}
                  </span>
                </div>
              );
            }
            const m = item.msg;
            const mine = m.from === side;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                      mine
                        ? "bg-gray-900 text-white rounded-br-md"
                        : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5 px-1">{fmtTime(m.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Мессеж бичих..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0"
            aria-label="Илгээх"
          >
            <Send className="w-4 h-4 text-white ml-0.5" />
          </button>
        </div>
      </div>
    </main>
  );
}
