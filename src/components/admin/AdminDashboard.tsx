"use client";

import Link from "next/link";
import TrendChart from "./TrendChart";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  Flag,
  ImageIcon,
  Info,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  adminFetch,
  CATEGORY_KO,
  exportCsv,
  formatDate,
  type Metric,
  type Overview,
} from "@/lib/admin/types";
import { EmptyState, ErrorNotice, PageHeading } from "./AdminUI";

const metrics = [
  {
    key: "users" as Metric,
    label: "전체 회원",
    chartLabel: "신규 가입 회원",
    icon: Users,
    unit: "명",
  },
  {
    key: "shops" as Metric,
    label: "등록 업체",
    chartLabel: "신규 등록 업체",
    icon: Store,
    unit: "개",
  },
  {
    key: "orders" as Metric,
    label: "주문·예약",
    chartLabel: "신규 주문·예약",
    icon: ShoppingBag,
    unit: "건",
  },
  {
    key: "posts" as Metric,
    label: "커뮤니티 글",
    chartLabel: "새 커뮤니티 글",
    icon: FileText,
    unit: "개",
  },
];
const categoryColors = ["#ff8a3d", "#ffc488", "#7caa9a", "#a5b9d0", "#b5a5c5"];

export default function AdminDashboard({
  previewData,
}: {
  previewData?: Overview;
}) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Overview | null>(previewData ?? null);
  const [metric, setMetric] = useState<Metric>("users");
  const [loading, setLoading] = useState(!previewData);
  const [error, setError] = useState("");
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (previewData) return;
      setLoading(true);
      setError("");
      try {
        setData(
          await adminFetch<Overview>(`/api/admin/overview?days=${days}`, {
            signal,
          }),
        );
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "통계를 불러오지 못했어요.",
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
    previewData ? "/login?redirect=" + encodeURIComponent(href) : href;
  const selectedMetric = metrics.find((item) => item.key === metric)!;
  const visibleDaily = data?.daily.slice(-days) ?? [];
  const currentPeriod = previewData
    ? visibleDaily.reduce((total, row) => total + row[metric], 0)
    : (data?.period[metric] ?? 0);
  function download() {
    if (!data) return;
    exportCsv(`mongpass-운영통계-${days}일.csv`, [
      ["날짜", "신규 회원", "신규 업체", "주문·예약", "커뮤니티 글"],
      ...visibleDaily.map((row) => [
        row.date,
        row.users,
        row.shops,
        row.orders,
        row.posts,
      ]),
    ]);
  }

  return (
    <>
      <PageHeading
        title="관리자 홈"
        description="안녕하세요! 오늘도 Mongpass의 새로운 연결을 함께 만들어가요."
      >
        <button
          className="mp-icon-button"
          aria-label="통계 새로고침"
          disabled={loading || !!previewData}
          onClick={() => refresh()}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
        <button
          className="mp-btn"
          disabled={!data || loading}
          onClick={download}
        >
          <ArrowDownToLine size={14} />
          리포트 다운로드
        </button>
      </PageHeading>
      {error && <ErrorNotice message={error} onRetry={() => refresh()} />}
      <section className="mp-welcome-banner" aria-label="승인 대기 안내">
        <div className="mp-welcome-copy">
          <div className="mp-eyebrow">
            <Sparkles size={12} /> 함께 성장하는 Mongpass
          </div>
          <h2>
            {data?.totals.pending ? (
              <>
                새로운 업체{" "}
                <span style={{ color: "var(--mp-orange)" }}>
                  {data.totals.pending}곳
                </span>
                이 연결을 기다리고 있어요
              </>
            ) : (
              "좋은 비즈니스의 시작, Mongpass와 함께해요"
            )}
          </h2>
          <p>
            업체 정보를 검토하고, 우리 이웃에게 믿을 수 있는 서비스를 소개해
            주세요.
          </p>
          <Link
            href={link("/admin/shops?status=pending")}
            className="mp-btn mp-btn-dark"
          >
            업체 검토하기 <ArrowRight size={13} />
          </Link>
        </div>
        <StoreIllustration />
      </section>
      <div className="mp-dashboard-grid">
        <section className="mp-panel mp-panel-pad" aria-busy={loading}>
          <div className="mp-stats-top">
            <h2>한눈에 보는 운영 현황</h2>
            <div>
              <CalendarDays size={13} color="#979da5" />
              <select
                aria-label="통계 기간"
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
              >
                <option value={7}>최근 7일</option>
                <option value={30}>최근 30일</option>
                <option value={90}>최근 90일</option>
              </select>
            </div>
          </div>
          {!data ? (
            <div
              className="mp-skeleton"
              role="status"
              aria-label="통계 불러오는 중"
            />
          ) : (
            <>
              <div
                className="mp-stat-grid"
                role="group"
                aria-label="통계 지표 선택"
              >
                {metrics.map(({ key, label, icon: Icon, unit }) => {
                  const current = previewData
                    ? visibleDaily.reduce((sum, row) => sum + row[key], 0)
                    : data.period[key];
                  const previous = data.previous[key];
                  const growth = previous
                    ? Math.round(((current - previous) / previous) * 100)
                    : null;
                  return (
                    <button
                      key={key}
                      onClick={() => setMetric(key)}
                      className={`mp-stat ${metric === key ? "active" : ""}`}
                      aria-pressed={metric === key}
                    >
                      <span className="mp-stat-label">
                        <Icon size={12} />
                        {label}
                      </span>
                      <strong>
                        {data.totals[key].toLocaleString()}
                        <small style={{ marginLeft: 3, fontWeight: 400 }}>
                          {unit}
                        </small>
                      </strong>
                      <span className="mp-trend">
                        <TrendingUp size={10} />
                        {growth === null
                          ? `기간 내 +${current.toLocaleString()}${unit}`
                          : `이전 기간 대비 ${growth > 0 ? "+" : ""}${growth}%`}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mp-chart-header">
                <b>
                  {selectedMetric.chartLabel} 추이{" "}
                  <span style={{ marginLeft: 5 }}>
                    총 {currentPeriod.toLocaleString()}
                    {selectedMetric.unit}
                  </span>
                </b>
                <span>
                  {visibleDaily[0]?.date.replace(/-/g, ".")} –{" "}
                  {visibleDaily[visibleDaily.length - 1]?.date.replace(
                    /-/g,
                    ".",
                  )}
                </span>
              </div>
              <TrendChart
                points={visibleDaily.map((row) => ({
                  date: row.date,
                  value: row[metric],
                }))}
                unit={selectedMetric.unit}
                label={selectedMetric.chartLabel}
              />
              <p className="mp-chart-caption">
                <Info size={11} />
                한국 시간(KST) 기준이며, 신규 등록 데이터를 집계합니다.
              </p>
              <div className="mp-chart-footer">
                <span>
                  <span className="mp-live-dot" />
                  {previewData
                    ? "미리보기용 샘플 데이터"
                    : `${new Date(data.generatedAt).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" })} 기준 업데이트`}
                </span>
                <span>
                  더 많은 연결, <b>함께 만드는 성장</b>
                </span>
              </div>
            </>
          )}
        </section>
        <aside className="mp-dashboard-aside">
          <section className="mp-panel mp-panel-pad mp-side-card">
            <h2>
              지금 확인해 주세요{" "}
              <span className="mp-pill" style={{ marginLeft: 4 }}>
                {data ? data.totals.pending + data.totals.reports : "…"}
              </span>
            </h2>
            <Link
              href={link("/admin/shops?status=pending")}
              className="mp-task-row"
            >
              <span>
                <Clock3 size={15} />
                업체 승인 대기
              </span>
              <strong>
                {data?.totals.pending ?? "—"}
                <small>건</small>
                <ChevronRight size={13} />
              </strong>
            </Link>
            <Link href={link("/admin/reports")} className="mp-task-row">
              <span>
                <Flag size={15} />
                미처리 신고
              </span>
              <strong>
                {data?.totals.reports ?? "—"}
                <small>건</small>
                <ChevronRight size={13} />
              </strong>
            </Link>
            <Link href={link("/admin/banner")} className="mp-task-row">
              <span>
                <ImageIcon size={15} />
                등록 배너
              </span>
              <strong>
                {data?.totals.banners ?? "—"}
                <small>개</small>
                <ChevronRight size={13} />
              </strong>
            </Link>
          </section>
          <section className="mp-panel mp-panel-pad mp-side-card">
            <div className="mp-section-title" style={{ marginBottom: 6 }}>
              <h2>우리 업체 카테고리</h2>
              <Store size={14} color="#a7adb4" />
            </div>
            {!data || !data.categories.length ? (
              <p style={{ color: "#a0a6ad", fontSize: 11, marginTop: 15 }}>
                승인된 업체가 등록되면 표시돼요.
              </p>
            ) : (
              data.categories.slice(0, 5).map((item, index) => {
                const total = data.categories.reduce(
                  (sum, row) => sum + row.count,
                  0,
                );
                return (
                  <div
                    key={item.category}
                    style={
                      {
                        "--category-color": categoryColors[index],
                      } as React.CSSProperties
                    }
                  >
                    <div className="mp-category-row">
                      <span className="mp-category-label">
                        <i />
                        {CATEGORY_KO[item.category] ?? item.category}
                      </span>
                      <span>
                        {item.count}개{" "}
                        <span style={{ color: "#a9afb7", marginLeft: 5 }}>
                          {Math.round((item.count / total) * 100)}%
                        </span>
                      </span>
                    </div>
                    <div className="mp-category-track">
                      <i style={{ width: `${(item.count / total) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </aside>
      </div>
      <div className="mp-bottom-grid">
        <section className="mp-panel mp-panel-pad">
          <div className="mp-section-title">
            <h2>
              승인을 기다리는 업체{" "}
              <span className="mp-pill">{data?.totals.pending ?? "—"}</span>
            </h2>
            <Link
              href={link("/admin/shops?status=pending")}
              className="mp-text-button"
            >
              전체 보기 <ChevronRight size={13} />
            </Link>
          </div>
          {data?.pendingShops.length ? (
            <div className="mp-queue-list">
              {data.pendingShops.slice(0, 3).map((shop) => (
                <div className="mp-queue-row" key={shop.id}>
                  <div className="mp-shop-avatar">{shop.name.slice(0, 1)}</div>
                  <Link
                    href={link(
                      "/admin/shops?q=" + encodeURIComponent(shop.name),
                    )}
                  >
                    <b>{shop.name}</b>
                    <p>
                      {CATEGORY_KO[shop.category]} · {shop.ownerName} ·{" "}
                      {formatDate(shop.createdAt)}
                    </p>
                  </Link>
                  <span className="mp-status pending">승인 대기</span>
                  <Link
                    href={link(
                      "/admin/shops?q=" + encodeURIComponent(shop.name),
                    )}
                    className="mp-btn mp-btn-small"
                  >
                    검토
                    <ChevronRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="모든 업체 검토가 완료됐어요"
              description="새로운 업체가 등록되면 이곳에서 확인할 수 있어요."
            />
          )}
        </section>
        <section className="mp-panel mp-panel-pad">
          <div className="mp-section-title">
            <h2>최근 소식·공지</h2>
            <Link
              href={link("/admin/news")}
              className="mp-text-button"
              aria-label="소식·공지 전체 보기"
            >
              <ChevronRight size={15} />
            </Link>
          </div>
          {data?.news.length ? (
            data.news.map((article) => (
              <Link
                key={article.id}
                href={link("/admin/news")}
                className="mp-news-row"
              >
                <span>
                  {article.status === "draft" ? "임시 저장" : "게시됨"} ·{" "}
                  {formatDate(article.createdAt)}
                </span>
                <b>{article.title}</b>
              </Link>
            ))
          ) : (
            <EmptyState
              title="등록된 소식이 없어요"
              description="이웃에게 새로운 소식을 전해보세요."
            />
          )}
        </section>
      </div>
      <div className="mp-shortcuts">
        {[
          {
            href: "/admin/banner",
            icon: ImageIcon,
            title: "첫인상을 만드는 배너",
            description: "홈 화면 배너를 관리해 보세요",
          },
          {
            href: "/admin/news",
            icon: FileText,
            title: "이웃에게 전하는 소식",
            description: "새로운 소식과 공지를 작성해요",
          },
          {
            href: "/admin/shops?status=approved",
            icon: Sparkles,
            title: "함께 성장하는 업체",
            description: "추천 업체와 운영 정보를 확인해요",
          },
        ].map(({ href, icon: Icon, title, description }) => (
          <Link href={link(href)} key={href} className="mp-shortcut">
            <Icon size={22} strokeWidth={1.5} />
            <div>
              <b>{title}</b>
              <p>{description}</p>
            </div>
            <ArrowUpRight size={15} />
          </Link>
        ))}
      </div>
    </>
  );
}

function StoreIllustration() {
  return (
    <svg
      className="mp-store-art"
      viewBox="0 0 180 135"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="94" cy="121" rx="69" ry="9" fill="#f4e5d5" />
      <circle cx="94" cy="64" r="56" fill="#ffecd8" />
      <path d="M49 56h91v61H49z" fill="#fff" stroke="#e6d8ca" />
      <path d="M46 46h97l7 24H39z" fill="#ffb56e" />
      <path
        d="M47 46h17l-3 24H39zm34 0h17l2 24H79zm34 0h17l11 24h-24z"
        fill="#fff5e8"
      />
      <path
        d="M39 70h22v3c0 6-5 10-11 10s-11-4-11-10zm40 0h21v3c0 6-4 10-10 10s-11-4-11-10zm40 0h31v3c0 6-8 10-15 10s-16-4-16-10z"
        fill="#ffad63"
      />
      <path
        d="M61 70h18v3c0 6-4 10-9 10s-9-4-9-10zm39 0h19v3c0 6-4 10-9 10s-10-4-10-10z"
        fill="#fff4e5"
      />
      <rect x="65" y="89" width="27" height="28" rx="2" fill="#f9eee1" />
      <rect x="103" y="91" width="24" height="16" rx="2" fill="#e9f1ec" />
      <path d="M115 92v14m-11-7h22" stroke="#d2e2d8" />
      <rect x="44" y="114" width="102" height="5" rx="2" fill="#eacfb2" />
      <rect x="70" y="31" width="48" height="14" rx="4" fill="#f58b36" />
      <text
        x="94"
        y="41"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="white"
        letterSpacing="1"
      >
        MONGPASS
      </text>
      <path
        d="M33 108l-3-19m0 13l-8-5m8-1l6-6"
        stroke="#7eaa86"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M22 107h15l-3 13h-9z" fill="#f4c08b" />
      <circle cx="150" cy="35" r="12" fill="white" />
      <path
        d="M145 35l4 4 7-8"
        stroke="#80ae8b"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 44h7m-3-4v8m129 39h7m-4-4v8"
        stroke="#e8be8c"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
