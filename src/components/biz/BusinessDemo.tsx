"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Send, Store } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { ErrorNotice, PageHeading } from "@/components/admin/AdminUI";
import { BizContext, useBusiness } from "./BizContext";
import BizDashboard from "./BizDashboard";
import {
  businessPreviewRequest,
  createBusinessDemoState,
  demoOverview,
  type BusinessDemoState,
} from "@/lib/admin/businessPreview";
import type { BusinessOverview } from "@/lib/admin/business";
import type { adminFetch } from "@/lib/admin/types";
import type { MenuItem } from "@/lib/menuStore";
import type { ChatMessage } from "@/lib/chatStore";
import type { uploadImage } from "@/lib/images/upload";

const STORAGE_KEY = "mongpass-business-demo-v1";
const user = {
  id: "sample-owner",
  name: "Бизнес эзэмшигч",
  email: "Туршилтын бүртгэл",
  role: "user" as const,
  image_url: null,
};

export default function BusinessDemo({
  initial,
  children,
}: {
  initial: BusinessOverview;
  children: React.ReactNode;
}) {
  const [store, setStore] = useState(() => createBusinessDemoState(initial));
  const state = useRef(store);
  const [ready, setReady] = useState(false);
  const [resetEpoch, setResetEpoch] = useState(0);
  const commit = useCallback((next: BusinessDemoState) => {
    state.current = next;
    setStore(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* This tab still retains the demo if storage is full. */
    }
  }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(STORAGE_KEY) ?? "null",
      ) as BusinessDemoState | null;
      if (
        saved?.version === 1 &&
        saved.overview?.shop?.id === "sample-business" &&
        [
          saved.menu,
          saved.orders,
          saved.reviews,
          saved.threads,
          saved.notices,
        ].every(Array.isArray) &&
        saved.messages
      )
        commit(saved);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);
  }, [commit]);
  const request: typeof adminFetch = useCallback(
    async <T,>(url: string, init?: RequestInit): Promise<T> => {
      if (init?.signal?.aborted)
        throw new DOMException("Aborted", "AbortError");
      const result = businessPreviewRequest(state.current, url, init);
      if (result.next) commit(result.next);
      return structuredClone(result.data) as T;
    },
    [commit],
  );
  const upload: typeof uploadImage = useCallback(async (file) => {
    if (!file.type.startsWith("image/") || file.size > 1024 * 1024)
      throw new Error("Туршилтад 1 МБ-аас бага зураг сонгоно уу.");
    const key = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return { key, url: key };
  }, []);
  const refresh = useCallback(async () => {}, []);
  if (!ready)
    return (
      <div className="fixed inset-0 bg-white z-40 flex items-center justify-center text-sm text-gray-500">
        Туршилтын удирдлагыг бэлтгэж байна…
      </div>
    );
  const overview = demoOverview(store);
  return (
    <BizContext.Provider
      value={{
        shop: overview.shop,
        user,
        refresh,
        preview: true,
        request,
        upload,
        overview,
      }}
    >
      <AdminShell
        preview
        user={user}
        business={{
          shop: overview.shop,
          pending: overview.totals.pending,
          unread: overview.totals.unread,
        }}
        notice={
        <div className="mp-demo-bar">
          <span>
            <b>Нэвтрэхгүйгээр туршиж байна</b> · Өөрчлөлт зөвхөн энэ цонхны туршилтад хадгалагдана.
          </span>
          <button
            onClick={() => {
              commit(createBusinessDemoState(initial));
              setResetEpoch((epoch) => epoch + 1);
            }}
          >
            <RotateCcw size={12} />
            <span className="mp-demo-reset-long">Туршилтыг дахин эхлүүлэх</span><span className="mp-demo-reset-short">Шинэчлэх</span>
          </button>
        </div>
        }
      >
        <div className="mp-biz-content" key={resetEpoch}>
          {children}
        </div>
      </AdminShell>
    </BizContext.Provider>
  );
}

export function BusinessDemoHome() {
  const { overview, request } = useBusiness();
  return (
    <BizDashboard
      previewData={overview}
      onToggleOpen={async () => {
        await request?.("/api/shops/sample-business/toggle-open", {
          method: "POST",
        });
      }}
    />
  );
}

export function BusinessDemoStore() {
  const { shop, request } = useBusiness();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  useEffect(() => {
    request?.<{ items: MenuItem[] }>("/api/shops/sample-business/menu").then(
      (result) => setMenu(result.items),
    );
  }, [request]);
  return (
    <>
      <PageHeading
        title={"Харилцагчид харагдах бизнес"}
        description={"Энэ нь харилцагчийн туршилтын харагдац юм. Бодит хуудсанд нөлөөлөхгүй."}
      >
        <Link className="mp-btn" href="/preview/biz/profile">
          <ArrowLeft size={13} />
          Бизнесийн мэдээлэл засах
        </Link>
      </PageHeading>
      <section className="mp-panel mp-panel-pad">
        <Store size={38} color="#ff8536" />
        <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 18 }}>
          {shop.name}
        </h2>
        <p style={{ color: "#7b8490", marginTop: 10 }}>{shop.description}</p>
        <dl className="mp-detail-grid">
          <dt>Хаяг</dt>
          <dd>{shop.address}</dd>
          <dt>Холбоо барих утас</dt>
          <dd>{shop.contactPhone}</dd>
          <dt>Ажиллах цаг</dt>
          <dd>{shop.openHours}</dd>
        </dl>
      </section>
      <div className="mp-demo-product-grid">
        {menu.map((item) => (
          <div key={item.id} className="mp-panel mp-panel-pad">
            <span className="mp-status">{item.category}</span>
            <h3 style={{ fontWeight: 700, marginTop: 12 }}>{item.name}</h3>
            <p className="mp-form-help">{item.desc}</p>
            <strong style={{ display: "block", marginTop: 15 }}>
              {item.price}
            </strong>
          </div>
        ))}
      </div>
    </>
  );
}

export function DemoConversation({ threadId }: { threadId: string }) {
  const { request, overview } = useBusiness();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    request?.<{ messages: ChatMessage[] }>(
      `/api/chat/threads/${encodeURIComponent(threadId)}/messages`,
    )
      .then((result) => setMessages(result.messages))
      .catch(() => setError("Туршилтын чат олдсонгүй."));
  }, [request, threadId]);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    try {
      const result = await request?.<{ messages: ChatMessage[] }>(
        `/api/chat/threads/${encodeURIComponent(threadId)}/messages`,
        { method: "POST", body: JSON.stringify({ text }) },
      );
      setMessages(result?.messages ?? []);
      setText("");
    } catch {
      setError("Мессеж илгээж чадсангүй.");
    }
  }
  return (
    <>
      <PageHeading
        title={"Харилцагчтай чатлах"}
        description={`${overview?.shop.name} · Илгээсэн мессеж зөвхөн туршилтад харагдана.`}
      >
        <Link href="/preview/biz/chat" className="mp-btn">
          <ArrowLeft size={13} />
          Чатын жагсаалт
        </Link>
      </PageHeading>
      {error && <ErrorNotice message={error} />}
      <section className="mp-panel mp-panel-pad">
        <div className="mp-demo-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mp-demo-message ${message.from === "shop" ? "from-shop" : ""}`}
            >
              <small>{message.from === "shop" ? "Бизнес" : "Харилцагч"}</small>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
        <form onSubmit={send} className="mp-demo-message-form">
          <input
            aria-label={"Туршилтын мессеж"}
            placeholder={"Мессеж бичнэ үү"}
            maxLength={2000}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <button className="mp-btn mp-btn-primary" disabled={!text.trim()}>
            <Send size={14} />
            Илгээх
          </button>
        </form>
      </section>
    </>
  );
}
