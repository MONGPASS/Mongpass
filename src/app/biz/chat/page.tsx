"use client";
import { adminFetch } from "@/lib/admin/types";

import Link from "next/link";
import { useBusiness } from "@/components/biz/BizContext";
import { businessPreviewHref } from "@/lib/admin/previewNavigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { formatDate } from "@/lib/admin/types";
import type { ChatThread } from "@/lib/chatStore";
import {
  EmptyState,
  ErrorNotice,
  PageHeading,
  Pagination,
} from "@/components/admin/AdminUI";

interface ChatPage {
  threads: ChatThread[];
  total: number;
  page: number;
  limit: number;
}
export default function BusinessChatPage() {
  const { request: customRequest, preview } = useBusiness();
  const request = customRequest ?? adminFetch;
  const [data, setData] = useState<ChatPage | null>(null);
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setData(
          await request<ChatPage>(
            "/api/biz/chats?" +
              new URLSearchParams({
                q,
                page: String(page),
                unread: String(onlyUnread),
              }),
            { signal },
          ),
        );
        setError("");
      } catch {
        if (!signal?.aborted) setError("Харилцагчийн чатыг ачаалж чадсангүй.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [q, page, onlyUnread, request],
  );
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    refresh(controller.signal);
    const timer = setInterval(() => {
      if (!document.hidden) refresh(controller.signal);
    }, 10000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [refresh]);
  return (
    <>
      <PageHeading
        title={"Харилцагчийн чат"}
        description={"Харилцагчийн асуултад хариулж, бизнесийнхээ харилцааг үргэлжлүүлээрэй."}
      />
      {error && <ErrorNotice message={error} onRetry={() => refresh()} />}
      <section className="mp-panel">
        <div className="mp-tabs">
          <button
            className={!onlyUnread ? "active" : ""}
            onClick={() => {
              setOnlyUnread(false);
              setPage(1);
            }}
          >
            Бүх чат
          </button>
          <button
            className={onlyUnread ? "active" : ""}
            onClick={() => {
              setOnlyUnread(true);
              setPage(1);
            }}
          >
            Уншаагүй чат
          </button>
        </div>
        <div className="mp-toolbar">
          <label className="mp-search-input">
            <Search size={15} />
            <input
              aria-label={"Харилцагч эсвэл чат хайх"}
              placeholder={"Харилцагчийн нэр, мессежээр хайх"}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        {loading ? (
          <div className="mp-loading" role="status">
            Харилцагчийн чатыг ачаалж байна…
          </div>
        ) : !data?.threads.length ? (
          <EmptyState
            title={"Одоогоор чат алга"}
            description={"Харилцагч мессеж илгээхэд эндээс хариулах боломжтой."}
          />
        ) : (
          <div className="mp-biz-chat-list">
            {data.threads.map((thread) => (
              <Link
                key={thread.id}
                href={
                  preview
                    ? businessPreviewHref(
                        `/chat/${encodeURIComponent(thread.id)}`,
                      )
                    : `/chat/${encodeURIComponent(thread.id)}`
                }
                className="mp-biz-chat-row"
              >
                <span className="mp-shop-avatar">
                  {thread.userName.slice(0, 1)}
                </span>
                <div>
                  <b>
                    {thread.userName}
                    {thread.unread && <span className="mp-unread-dot" />}
                  </b>
                  <p>{thread.lastMessagePreview || "Шинэ чат"}</p>
                </div>
                <span>{formatDate(thread.lastMessageAt, "mn-MN")}</span>
                <ChevronRight size={15} />
              </Link>
            ))}
          </div>
        )}
        {data && (
          <Pagination
            page={page}
            total={data.total}
            limit={data.limit}
            onChange={setPage}
          />
        )}
      </section>
    </>
  );
}
