"use client";
import { CATEGORY_MN, ORDER_MN, STATUS_MN } from "@/lib/admin/businessMessages";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  Download,
  Heart,
  Info,
  MessageCircle,
  Newspaper,
  RefreshCw,
  ShoppingBag,
  Star,
  Store,
} from "lucide-react";
import {
  adminFetch,
  exportCsv,
  formatDate,
} from "@/lib/admin/types";
import type { BusinessOverview } from "@/lib/admin/business";
import { toggleOpen } from "@/lib/shopStore";
import { getCategoryInfo } from "@/lib/categories";
import {
  EmptyState,
  ErrorNotice,
  PageHeading,
} from "@/components/admin/AdminUI";
import TrendChart from "@/components/admin/TrendChart";
import { businessPreviewHref } from "@/lib/admin/previewNavigation";

const metrics = [
  { key: "orders" as const, label: "Захиалга", icon: ShoppingBag, unit: "удаа" },
  {
    key: "chats" as const,
    label: "Харилцагчийн чат",
    icon: MessageCircle,
    unit: "удаа",
  },
  { key: "favorites" as const, label: "Дагагчид", icon: Heart, unit: "хүн" },
  { key: "reviews" as const, label: "Харилцагчийн үнэлгээ", icon: Star, unit: "ш" },
];
export default function BizDashboard({
  previewData,
  onToggleOpen,
}: {
  previewData?: BusinessOverview;
  onToggleOpen?: () => Promise<void>;
}) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<BusinessOverview | null>(
    previewData ?? null,
  );
  const [metric, setMetric] = useState<
    "orders" | "chats" | "favorites" | "reviews"
  >("orders");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!previewData);
  const [changing, setChanging] = useState(false);
  useEffect(() => {
    if (previewData) setData(previewData);
  }, [previewData]);
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (previewData) return;
      setLoading(true);
      setError("");
      try {
        setData(
          await adminFetch<BusinessOverview>("/api/biz/overview?days=" + days, {
            signal,
          }),
        );
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Бизнесийн мэдээллийг ачаалж чадсангүй.",
          );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [days, previewData],
  );
  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  const link = (href: string) =>
    previewData ? businessPreviewHref(href) : href;
  const selected = metrics.find((item) => item.key === metric)!;
  const daily = data?.daily.slice(-days) ?? [];
  const filled = data
    ? [
        !!data.shop.name,
        !!data.shop.description,
        !!data.shop.contactPhone && !!data.shop.address,
        !!data.shop.images?.length,
      ].filter(Boolean).length
    : 0;
  async function changeOpen() {
    if (!data || changing) return;
    setChanging(true);
    try {
      if (onToggleOpen) {
        await onToggleOpen();
        return;
      }
      const shop = await toggleOpen(data.shop.id);
      if (!shop) throw new Error();
      setData({ ...data, shop });
      window.dispatchEvent(new Event("biz-data-changed"));
    } catch {
      setError("Ажиллаж буй төлөвийг өөрчилж чадсангүй.");
    } finally {
      setChanging(false);
    }
  }
  return (
    <>
      <PageHeading
        title={data?.shop.name ?? "Бизнесийн нүүр"}
        description={`${data?.shop.address || "Манай бизнес"} · ${data ? CATEGORY_MN[data.shop.category] : "Бизнес профайл"}`}
      >
        {data && (
          <Link href={link(data ? `/category/${data.shop.category}/${data.shop.id}` : "/biz/profile")} className="mp-btn mp-btn-subtle">
            Бизнесээ харах <ArrowRight size={14} />
          </Link>
        )}
        <button
          className="mp-icon-button"
          aria-label={"Статистикийг шинэчлэх"}
          disabled={loading || !!previewData}
          onClick={() => refresh()}
        >
          <RefreshCw size={16} />
        </button>
      </PageHeading>
      {error && <ErrorNotice message={error} onRetry={() => refresh()} />}
      {data && data.shop.status !== "approved" && (
        <div className="mp-biz-approval">
          <Info size={15} />
          <span>
            {data.shop.status === "pending"
              ? "Ерөнхий админ таны бизнесийн мэдээллийг хянаж байна. Баталгаажсаны дараа нийтэд харагдана."
              : `Бизнесийн хүсэлтээс татгалзсан байна. ${data.shop.rejectionReason ?? "Мэдээллээ засаж, дахин хянуулаарай."}`}
          </span>
          <Link href={link("/biz/profile")}>
            Мэдээлэл шалгах <ChevronRight size={12} />
          </Link>
        </div>
      )}
      {data && <section className="mp-business-mobile-summary">
        <div className="mp-mobile-business-today"><div><small>Өнөөдрийн ажил</small><h2>Өдрийн мэнд 👋</h2></div>
          <button className={`mp-status ${data.shop.isOpen !== false ? "approved" : "rejected"}`} role="switch" aria-checked={data.shop.isOpen !== false} aria-label="Ажиллах төлөв өөрчлөх" disabled={changing} onClick={changeOpen}>{changing ? "Өөрчилж байна…" : data.shop.isOpen !== false ? "Нээлттэй" : "Хаалттай"}<ChevronRight size={13} /></button>
        </div>
        <div className="mp-mobile-task-grid">
          <Link href={link("/biz/orders")}><ShoppingBag size={20} /><strong>{data.totals.pending}</strong><span>Шинэ захиалга</span></Link>
          <Link href={link("/biz/chat")}><MessageCircle size={20} /><strong>{data.totals.unread}</strong><span>Уншаагүй чат</span></Link>
          <Link href={link("/biz/reviews")}><Star size={20} /><strong>{data.totals.unreplied}</strong><span>Хариулах үнэлгээ</span></Link>
        </div>
      </section>}
      <section className="mp-biz-mission">
        <div className="mp-eyebrow">
          <Store size={13} /> Үндсэн мэдээллээ бөглөх
        </div>
        <div className="mp-biz-mission-title">
          <div>
            <h2>
              {filled === 4
                ? "Харилцагчдаа угтахад бэлэн боллоо"
                : "Бизнесийн мэдээллээ бүрэн бөглөөрэй"}
            </h2>
            <p>
              Бизнесээ танилцуулж, илүү олон харилцагчтай холбогдоорой.
            </p>
          </div>
          <div
            className="mp-progress-ring"
            style={
              { "--progress": `${(filled / 4) * 100}%` } as React.CSSProperties
            }
          >
            <span>
              {filled}
              <small>/4</small>
            </span>
          </div>
        </div>
        <Link
          href={link("/biz/profile")}
          className="mp-btn mp-btn-dark"
          style={{ width: "100%", marginTop: 16 }}
        >
          {filled === 4 ? "Бизнес профайл удирдах" : "Профайл бөглөх"}{" "}
          <ArrowRight size={13} />
        </Link>
      </section>
      <section className="mp-panel mp-recommendations">
      <div className="mp-section-title">
        <h2>Бизнесийн хэрэгслүүд</h2>
        <span className="mp-recommendation-label">Таны бизнест хэрэгтэй боломжууд</span>
      </div>
      <div className="mp-biz-tools">
        <Link
          href={link(
            data
              ? (getCategoryInfo(data.shop.category).adminRoute ??
                  "/biz/profile")
              : "/biz/profile",
          )}
        >
          <div className="mp-tool-icon">
            <ShoppingBag size={19} />
          </div>
          <div>
            <b>Бараа, үйлчилгээ</b>
            <p>Цэс, бараа, үйлчилгээгээ бүртгээрэй</p>
          </div>
          <ChevronRight size={15} />
        </Link>
        <Link href={link("/biz/notices")}>
          <div
            className="mp-tool-icon"
            style={{ background: "#fff2df", color: "#dc9f3a" }}
          >
            <Newspaper size={19} />
          </div>
          <div>
            <b>Бизнесийн мэдээ нийтлэх</b>
            <p>Шинэ мэдээгээ харилцагчдадаа хүргээрэй</p>
          </div>
          <ChevronRight size={15} />
        </Link>
      </div>
      </section>
      <div className="mp-dashboard-grid mp-biz-dashboard-grid">
        <section className="mp-panel mp-panel-pad" aria-busy={loading}>
          <div className="mp-stats-top">
            <h2>Сүүлийн {days} өдрийн статистик</h2>
            <select
              aria-label={"Статистикийн хугацаа"}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              <option value={7}>Сүүлийн 7 хоног</option>
              <option value={30}>Сүүлийн 30 хоног</option>
              <option value={90}>Сүүлийн 90 хоног</option>
            </select>
          </div>
          {!data ? (
            <div className="mp-skeleton" />
          ) : (
            <>
              <div className="mp-stat-grid">
                {metrics.map(({ key, label, icon: Icon, unit }) => (
                  <button
                    key={key}
                    className={`mp-stat ${metric === key ? "active" : ""}`}
                    aria-pressed={metric === key}
                    onClick={() => setMetric(key)}
                  >
                    <span className="mp-stat-label">
                      <Icon size={12} />
                      {label}
                    </span>
                    <strong>
                      {daily.reduce((total, day) => total + day[key], 0).toLocaleString()}
                      <small style={{ marginLeft: 3, fontWeight: 400 }}>
                        {unit}
                      </small>
                    </strong>
                    <span className="mp-trend">
                      Нийт{" "}
                      {data.totals[key].toLocaleString()}
                      {unit}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mp-chart-header">
                <b>{selected.label} өөрчлөлт</b>
                <span>
                  {daily[0]?.date.replace(/-/g, ".")} –{" "}
                  {daily[daily.length - 1]?.date.replace(/-/g, ".")}
                </span>
              </div>
              <TrendChart
                points={daily.map((row) => ({
                  date: row.date,
                  value: row[metric],
                }))}
                label={selected.label}
                unit={selected.unit}
                color="#7297df"
              />
              <p className="mp-chart-caption">
                <Info size={11} />
                {metric === "chats"
                  ? "Чатын тоог сүүлд идэвхтэй байсан өдрөөр тооцно."
                  : metric === "favorites"
                    ? "Одоо дагаж буй харилцагчдын дагасан өдрөөр тооцно."
                    : "Шинэ бүртгэлийг Солонгосын цагаар (KST) тооцно."}
              </p>
              <div className="mp-chart-footer">
                <span>
                  <span className="mp-live-dot" />
                  {previewData
                    ? "Туршилтын өгөгдөл"
                    : "Таны бизнесийн бодит өгөгдөл"}
                </span>
                <button
                  className="mp-text-button"
                  onClick={() =>
                    exportCsv("mongpass-business-statistics.csv", [
                      ["Огноо", "Захиалга", "Чат", "Дагагчид", "Үнэлгээ"],
                      ...daily.map((day) => [
                        day.date,
                        day.orders,
                        day.chats,
                        day.favorites,
                        day.reviews,
                      ]),
                    ])
                  }
                >
                  <Download size={12} />
                  Статистик татах
                </button>
              </div>
            </>
          )}
        </section>
        <aside className="mp-dashboard-aside">
          <section className="mp-panel mp-panel-pad mp-side-card">
            <h2>Өнөөдрийн ажлууд</h2>
            <Link href={link("/biz/orders")} className="mp-task-row">
              <span>
                <Clock3 size={15} />
                Шинэ захиалга
              </span>
              <strong>
                {data?.totals.pending ?? "—"}
                <small>удаа</small>
                <ChevronRight size={13} />
              </strong>
            </Link>
            <Link href={link("/biz/chat")} className="mp-task-row">
              <span>
                <MessageCircle size={15} />
                Уншаагүй чат
              </span>
              <strong>
                {data?.totals.unread ?? "—"}
                <small>удаа</small>
                <ChevronRight size={13} />
              </strong>
            </Link>
            <Link href={link("/biz/reviews")} className="mp-task-row">
              <span>
                <Star size={15} />
                Хариулаагүй үнэлгээ
              </span>
              <strong>
                {data?.totals.unreplied ?? "—"}
                <small>ш</small>
                <ChevronRight size={13} />
              </strong>
            </Link>
          </section>
          <section className="mp-panel mp-panel-pad mp-side-card">
            <h2>Бизнесийн төлөв</h2>
            <div className="mp-task-row">
              <span>Ажиллах төлөв</span>
              {previewData && !onToggleOpen ? (
                <span className="mp-status approved">Нээлттэй</span>
              ) : (
                <button
                  role="switch"
                  aria-checked={data?.shop.isOpen !== false}
                  aria-label={"Ажиллах төлөв өөрчлөх"}
                  disabled={changing || !data}
                  onClick={changeOpen}
                  className={`mp-status ${data?.shop.isOpen !== false ? "approved" : "rejected"}`}
                >
                  {changing
                    ? "Өөрчилж байна…"
                    : data?.shop.isOpen !== false
                      ? "Нээлттэй · Өөрчлөх"
                      : "Хаалттай · Өөрчлөх"}
                </button>
              )}
            </div>
            <div className="mp-task-row">
              <span>Бүртгэлийн төлөв</span>
              <span className={`mp-status ${data?.shop.status ?? ""}`}>
                {data ? STATUS_MN[data.shop.status] : "—"}
              </span>
            </div>
            <div className="mp-task-row">
              <span>Дундаж үнэлгээ</span>
              <strong>
                <Star size={13} color="#edaa49" />
                {data?.totals.rating ? data.totals.rating.toFixed(1) : "—"}
              </strong>
            </div>
          </section>
        </aside>
      </div>
      <section className="mp-panel mp-panel-pad" style={{ marginTop: 26 }}>
        <div className="mp-section-title">
          <h2>Сүүлийн захиалгууд</h2>
          <Link href={link("/biz/orders")} className="mp-text-button">
            Бүгдийг харах <ChevronRight size={13} />
          </Link>
        </div>
        {data?.recentOrders.length ? (
          <div className="mp-table-scroll">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Харилцагч</th>
                  <th>Захиалгын дугаар</th>
                  <th>Хүлээн авсан огноо</th>
                  <th>Явц</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.slice(0, 3).map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.customerName}</strong>
                    </td>
                    <td>{order.id.slice(0, 20)}</td>
                    <td>{formatDate(order.createdAt, "mn-MN")}</td>
                    <td>
                      <span className={`mp-status ${order.status}`}>
                        {ORDER_MN[order.status]}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={link(
                          "/biz/orders?q=" + encodeURIComponent(order.id),
                        )}
                        className="mp-text-button"
                      >
                        Харах <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={"Одоогоор захиалга алга"}
            description={"Харилцагчийн анхны захиалга энд харагдана."}
          />
        )}
      </section>
    </>
  );
}
