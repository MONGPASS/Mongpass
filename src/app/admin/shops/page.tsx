"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Download,
  ExternalLink,
  Search,
  Sparkles,
  Store,
  Trash2,
  X,
} from "lucide-react";
import {
  approveShop,
  deleteShop,
  rejectShop,
  toggleFeatured,
} from "@/lib/shopStore";
import {
  adminFetch,
  CATEGORY_KO,
  exportCsv,
  formatDate,
  STATUS_KO,
  type AdminShop,
} from "@/lib/admin/types";
import { r2Url } from "@/lib/images/upload";
import {
  EmptyState,
  ErrorNotice,
  Modal,
  PageHeading,
  Pagination,
} from "@/components/admin/AdminUI";

type Status = "all" | "pending" | "approved" | "rejected";
interface ShopPage {
  shops: AdminShop[];
  counts: Record<Status, number>;
  total: number;
  page: number;
  limit: number;
}

export default function AdminShopsPage() {
  const [status, setStatus] = useState<Status>("all");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ShopPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<AdminShop | null>(null);
  const [action, setAction] = useState<{
    type: "approve" | "reject" | "delete";
    shops: AdminShop[];
  } | null>(null);
  const [reason, setReason] = useState("");
  const [deleteName, setDeleteName] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialStatus = params.get("status");
    if (
      initialStatus &&
      ["all", "pending", "approved", "rejected"].includes(initialStatus)
    )
      setStatus(initialStatus as Status);
    setQ(params.get("q") ?? "");
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          status,
          q: query,
          category,
          page: String(page),
        });
        const next = await adminFetch<ShopPage>("/api/admin/shops?" + params, {
          signal,
        });
        if (page > 1 && !next.shops.length) {
          setPage(page - 1);
          return;
        }
        setData(next);
        setSelected([]);
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "업체를 불러오지 못했어요.",
          );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [status, query, category, page],
  );
  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  function startAction(
    type: "approve" | "reject" | "delete",
    shops: AdminShop[],
  ) {
    setAction({ type, shops });
    setReason("");
    setDeleteName("");
    setMessage("");
  }
  async function perform() {
    if (!action || busy) return;
    setBusy(true);
    setError("");
    try {
      const results = await Promise.allSettled(
        action.shops.map(async (shop) => {
          if (action.type === "approve") {
            if (!(await approveShop(shop.id))) throw new Error();
          }
          if (action.type === "reject") {
            if (!(await rejectShop(shop.id, reason.trim()))) throw new Error();
          }
          if (action.type === "delete") {
            if (!(await deleteShop(shop.id))) throw new Error();
          }
        }),
      );
      const failed = results.filter(
        (result) => result.status === "rejected",
      ).length;
      setAction(null);
      setDetail(null);
      await refresh();
      window.dispatchEvent(new Event("admin-data-changed"));
      if (failed)
        setError(
          `${failed}건을 처리하지 못했습니다. 현재 상태를 확인하고 다시 시도해 주세요.`,
        );
      else
        setMessage(
          `${results.length}개 업체를 ${action.type === "approve" ? "승인했습니다" : action.type === "reject" ? "반려했습니다" : "삭제했습니다"}.`,
        );
    } finally {
      setBusy(false);
    }
  }
  async function feature(shop: AdminShop) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await toggleFeatured(shop.id);
      await refresh();
      setDetail(null);
      window.dispatchEvent(new Event("admin-data-changed"));
      setMessage("추천 업체 설정을 변경했습니다.");
    } catch {
      setError("추천 업체 설정을 변경하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!data) return;
    exportCsv("mongpass-업체-현재페이지.csv", [
      ["업체명", "카테고리", "대표자", "이메일", "상태", "등록일"],
      ...data.shops.map((shop) => [
        shop.name,
        CATEGORY_KO[shop.category],
        shop.ownerName,
        shop.ownerEmail,
        STATUS_KO[shop.status],
        formatDate(shop.createdAt),
      ]),
    ]);
  }
  const selectedShops =
    data?.shops.filter((shop) => selected.includes(shop.id)) ?? [];
  return (
    <>
      <PageHeading
        title="업체 관리"
        description="Mongpass와 함께하는 업체를 확인하고, 새로운 비즈니스를 연결해 주세요."
      >
        <button
          className="mp-btn"
          disabled={!data?.shops.length || loading}
          onClick={download}
        >
          <Download size={14} />
          현재 페이지 내보내기
        </button>
      </PageHeading>
      {error && <ErrorNotice message={error} onRetry={() => refresh()} />}
      {message && (
        <div className="mp-success" role="status">
          {message}
        </div>
      )}
      <section className="mp-panel" aria-busy={loading}>
        <div className="mp-tabs" role="group" aria-label="업체 상태">
          {(["all", "pending", "approved", "rejected"] as Status[]).map(
            (tab) => (
              <button
                key={tab}
                className={tab === status ? "active" : ""}
                aria-pressed={tab === status}
                onClick={() => {
                  setStatus(tab);
                  setPage(1);
                }}
              >
                {tab === "all" ? "전체 업체" : STATUS_KO[tab]}
                <span>{data?.counts[tab] ?? "—"}</span>
              </button>
            ),
          )}
        </div>
        <div className="mp-toolbar">
          <label className="mp-search-input">
            <Search size={16} />
            <input
              aria-label="업체명, 대표자 또는 이메일 검색"
              placeholder="업체명, 대표자 또는 이메일 검색"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </label>
          <select
            aria-label="업체 카테고리"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">전체 카테고리</option>
            {Object.entries(CATEGORY_KO).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {(q || category || status !== "all") && (
            <button
              className="mp-text-button"
              onClick={() => {
                setQ("");
                setCategory("");
                setStatus("all");
                setPage(1);
              }}
            >
              필터 초기화
            </button>
          )}
        </div>
        {selected.length > 0 && (
          <div className="mp-bulk-bar">
            <b>{selected.length}개 선택</b>
            <button
              className="mp-btn mp-btn-small"
              disabled={
                busy || selectedShops.some((shop) => shop.status === "approved")
              }
              onClick={() => startAction("approve", selectedShops)}
            >
              <Check size={13} />
              선택 승인
            </button>
            <button onClick={() => setSelected([])}>선택 해제</button>
          </div>
        )}
        {loading ? (
          <div className="mp-loading" role="status">
            업체 정보를 불러오고 있어요…
          </div>
        ) : !data?.shops.length ? (
          <EmptyState title="조건에 맞는 업체가 없어요" />
        ) : (
          <div className="mp-table-scroll">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="현재 페이지 업체 전체 선택"
                      checked={selected.length === data.shops.length}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? data.shops.map((shop) => shop.id)
                            : [],
                        )
                      }
                    />
                  </th>
                  <th>업체명</th>
                  <th>카테고리</th>
                  <th>대표자</th>
                  <th>등록일</th>
                  <th>상태</th>
                  <th style={{ textAlign: "right" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {data.shops.map((shop) => (
                  <tr key={shop.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`${shop.name} 선택`}
                        checked={selected.includes(shop.id)}
                        onChange={(event) =>
                          setSelected((previous) =>
                            event.target.checked
                              ? [...previous, shop.id]
                              : previous.filter((id) => id !== shop.id),
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="mp-row-link"
                        onClick={() => setDetail(shop)}
                      >
                        <span className="mp-shop-avatar">
                          {shop.name.slice(0, 1)}
                        </span>
                        <span>
                          {shop.name}
                          {shop.featured && (
                            <Sparkles
                              size={12}
                              style={{
                                display: "inline",
                                marginLeft: 5,
                                color: "#eab553",
                              }}
                            />
                          )}
                        </span>
                      </button>
                    </td>
                    <td>{CATEGORY_KO[shop.category]}</td>
                    <td>
                      {shop.ownerName}
                      <p>{shop.ownerEmail}</p>
                    </td>
                    <td>{formatDate(shop.createdAt)}</td>
                    <td>
                      <span className={`mp-status ${shop.status}`}>
                        {STATUS_KO[shop.status]}
                      </span>
                    </td>
                    <td>
                      <div className="mp-row-actions">
                        <button
                          className="mp-btn mp-btn-small"
                          onClick={() => setDetail(shop)}
                        >
                          상세
                        </button>
                        {shop.status === "pending" && (
                          <button
                            className="mp-btn mp-btn-primary mp-btn-small"
                            disabled={busy}
                            onClick={() => startAction("approve", [shop])}
                          >
                            승인
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      {detail && !action && (
        <Modal title="업체 상세 정보" wide onClose={() => setDetail(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="mp-shop-avatar">
              <Store size={20} />
            </span>
            <div>
              <b>{detail.name}</b>
              <p>
                {CATEGORY_KO[detail.category]} ·{" "}
                <span className={`mp-status ${detail.status}`}>
                  {STATUS_KO[detail.status]}
                </span>
              </p>
            </div>
          </div>
          <dl className="mp-detail-grid">
            <dt>소개</dt>
            <dd>{detail.description || "미등록"}</dd>
            <dt>대표자</dt>
            <dd>
              {detail.ownerName} ({detail.ownerEmail})
            </dd>
            <dt>연락처</dt>
            <dd>{detail.contactPhone || "미등록"}</dd>
            <dt>주소</dt>
            <dd>{detail.address || "미등록"}</dd>
            <dt>운영 시간</dt>
            <dd>{detail.openHours || "미등록"}</dd>
            <dt>등록일</dt>
            <dd>{formatDate(detail.createdAt)}</dd>
            {detail.rejectionReason && (
              <>
                <dt>반려 사유</dt>
                <dd>{detail.rejectionReason}</dd>
              </>
            )}
          </dl>
          {!!detail.images?.length && (
            <div className="mp-detail-images">
              {detail.images.map((image) => (
                <a
                  key={image}
                  href={r2Url(image)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r2Url(image)} alt={`${detail.name} 등록 사진`} />
                </a>
              ))}
            </div>
          )}
          <div
            className="mp-modal-actions"
            style={{ flexWrap: "wrap", justifyContent: "flex-start" }}
          >
            <Link
              href={`/category/${detail.category}/${detail.id}`}
              target="_blank"
              className="mp-btn"
            >
              <ExternalLink size={13} />
              서비스에서 보기
            </Link>
            {detail.status === "approved" && (
              <button
                className="mp-btn"
                disabled={busy}
                onClick={() => feature(detail)}
              >
                <Sparkles size={13} />
                {detail.featured ? "추천 해제" : "추천 업체 설정"}
              </button>
            )}
            {detail.status !== "approved" && (
              <button
                className="mp-btn mp-btn-primary"
                onClick={() => startAction("approve", [detail])}
              >
                <Check size={13} />
                승인
              </button>
            )}
            {detail.status !== "rejected" && (
              <button
                className="mp-btn"
                onClick={() => startAction("reject", [detail])}
              >
                <X size={13} />
                반려
              </button>
            )}
            <button
              className="mp-btn mp-btn-danger"
              onClick={() => startAction("delete", [detail])}
            >
              <Trash2 size={13} />
              삭제
            </button>
          </div>
        </Modal>
      )}
      {action && (
        <Modal
          title={
            action.type === "approve"
              ? "업체를 승인할까요?"
              : action.type === "reject"
                ? "업체 반려 사유"
                : "업체 영구 삭제"
          }
          onClose={() => {
            if (!busy) setAction(null);
          }}
        >
          <p>
            {action.type === "approve"
              ? `${action.shops.length}개 업체가 승인되면 Mongpass 서비스에 공개됩니다.`
              : action.type === "reject"
                ? "업체가 정보를 보완할 수 있도록 반려 사유를 입력해 주세요. 이 사유는 대표자에게 표시됩니다."
                : `“${action.shops[0].name}”의 주문, 채팅, 사진도 함께 삭제됩니다. 되돌릴 수 없습니다. 업체명을 입력해 확인해 주세요.`}
          </p>
          {action.type === "reject" && (
            <textarea
              aria-label="반려 사유"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="예: 사업장 주소와 연락처를 확인해 주세요."
              maxLength={1000}
            />
          )}
          {action.type === "delete" && (
            <input
              aria-label="삭제할 업체명 확인"
              value={deleteName}
              onChange={(event) => setDeleteName(event.target.value)}
              placeholder={action.shops[0].name}
            />
          )}
          <div className="mp-modal-actions">
            <button
              className="mp-btn"
              disabled={busy}
              onClick={() => setAction(null)}
            >
              취소
            </button>
            <button
              className={`mp-btn ${action.type === "delete" ? "mp-btn-danger" : "mp-btn-primary"}`}
              disabled={
                busy ||
                (action.type === "reject" && !reason.trim()) ||
                (action.type === "delete" &&
                  deleteName !== action.shops[0].name)
              }
              onClick={perform}
            >
              {busy
                ? "처리 중…"
                : action.type === "approve"
                  ? "승인하기"
                  : action.type === "reject"
                    ? "반려하기"
                    : "영구 삭제"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
