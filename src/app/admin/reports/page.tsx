"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Search, Trash2, Undo2 } from "lucide-react";
import type { Report } from "@/lib/reportStore";
import { adminFetch, formatDate } from "@/lib/admin/types";
import {
  EmptyState,
  ErrorNotice,
  Modal,
  PageHeading,
  Pagination,
} from "@/components/admin/AdminUI";

const labels = {
  post: "게시글",
  comment: "댓글",
  review: "업체 리뷰",
  shop: "업체",
};
interface ReportPage {
  reports: Report[];
  total: number;
  page: number;
  limit: number;
}
export default function AdminReportsPage() {
  const [status, setStatus] = useState<"open" | "resolved">("open");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReportPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [detail, setDetail] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
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
        const next = await adminFetch<ReportPage>(
          "/api/reports?" +
            new URLSearchParams({ status, q: query, page: String(page) }),
          { signal },
        );
        if (page > 1 && !next.reports.length) {
          setPage(page - 1);
          return;
        }
        setData(next);
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "신고를 불러오지 못했어요.",
          );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [status, query, page],
  );
  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  function endpoint(report: Report) {
    const id = encodeURIComponent(report.targetId);
    if (report.targetType === "post") return "/api/community/posts/" + id;
    if (report.targetType === "shop") return "/api/shops/" + id;
    if (report.targetType === "review") return "/api/reviews/" + id;
    if (report.parentId)
      return `/api/community/posts/${encodeURIComponent(report.parentId)}/comments/${id}`;
    return null;
  }
  async function handleReport(remove: boolean) {
    if (!detail || busy) return;
    setBusy(true);
    setError("");
    try {
      if (remove) {
        const url = endpoint(detail);
        if (!url) throw new Error("삭제할 콘텐츠를 찾을 수 없습니다.");
        const response = await fetch(url, {
          method: "DELETE",
          credentials: "same-origin",
        });
        if (!response.ok && response.status !== 404)
          throw new Error("콘텐츠를 삭제하지 못했습니다.");
      }
      await adminFetch(`/api/reports/${encodeURIComponent(detail.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: remove || status === "open" ? "resolved" : "open",
        }),
      });
      setDetail(null);
      setDeleting(false);
      await refresh();
      window.dispatchEvent(new Event("admin-data-changed"));
      setMessage(
        remove
          ? "콘텐츠를 삭제하고 신고 처리를 완료했습니다."
          : status === "open"
            ? "신고를 처리 완료로 변경했습니다."
            : "신고를 다시 열었습니다.",
      );
    } catch (cause) {
      setDetail(null);
      setError(cause instanceof Error ? cause.message : "처리하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="신고 관리"
        description="이웃이 보내온 신고를 검토하고, 모두가 안심할 수 있는 Mongpass를 만들어요."
      />
      {error && <ErrorNotice message={error} onRetry={() => refresh()} />}
      {message && (
        <div className="mp-success" role="status">
          {message}
        </div>
      )}
      <section className="mp-panel" aria-busy={loading}>
        <div className="mp-tabs" role="group" aria-label="신고 상태">
          {(["open", "resolved"] as const).map((value) => (
            <button
              key={value}
              className={status === value ? "active" : ""}
              aria-pressed={status === value}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {value === "open" ? "처리 대기" : "처리 완료"}
            </button>
          ))}
        </div>
        <div className="mp-toolbar">
          <label className="mp-search-input">
            <Search size={15} />
            <input
              aria-label="신고자 또는 신고 사유 검색"
              placeholder="신고자 또는 신고 사유 검색"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </label>
        </div>
        {loading ? (
          <div className="mp-loading" role="status">
            신고를 불러오고 있어요…
          </div>
        ) : !data?.reports.length ? (
          <EmptyState
            title={
              status === "open"
                ? "처리할 신고가 없어요"
                : "처리 완료된 신고가 없어요"
            }
            description="이웃이 보내온 신고는 이곳에서 확인할 수 있어요."
          />
        ) : (
          <div className="mp-table-scroll">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>유형</th>
                  <th>신고 대상</th>
                  <th>신고 사유</th>
                  <th>신고자</th>
                  <th>접수일</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <span className="mp-status">
                        {labels[report.targetType]}
                      </span>
                    </td>
                    <td
                      style={{
                        maxWidth: 240,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <button
                        className="mp-row-link"
                        onClick={() => {
                          setDetail(report);
                          setDeleting(false);
                        }}
                      >
                        {report.targetPreview.slice(0, 45)}
                      </button>
                    </td>
                    <td
                      style={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {report.reason}
                    </td>
                    <td>{report.reporterName}</td>
                    <td>{formatDate(report.createdAt)}</td>
                    <td>
                      <button
                        className="mp-btn mp-btn-small"
                        onClick={() => {
                          setDetail(report);
                          setDeleting(false);
                        }}
                      >
                        검토
                      </button>
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
      {detail && (
        <Modal
          title={deleting ? "콘텐츠를 영구 삭제할까요?" : "신고 상세 검토"}
          onClose={() => {
            if (!busy) setDetail(null);
          }}
        >
          <span className="mp-status">{labels[detail.targetType]}</span>
          <h3 style={{ margin: "12px 0", fontWeight: 600 }}>
            {detail.targetPreview}
          </h3>
          <dl className="mp-detail-grid">
            <dt>신고 사유</dt>
            <dd>{detail.reason}</dd>
            <dt>신고자</dt>
            <dd>{detail.reporterName}</dd>
            <dt>접수일</dt>
            <dd>{formatDate(detail.createdAt)}</dd>
          </dl>
          {deleting && (
            <div className="mp-error" style={{ marginTop: 20 }}>
              이 작업은 되돌릴 수 없습니다.
              {detail.targetType === "shop" &&
                " 업체의 주문·채팅·사진도 함께 삭제됩니다."}
            </div>
          )}
          <div
            className="mp-modal-actions"
            style={{ flexWrap: "wrap", justifyContent: "flex-start" }}
          >
            {detail.targetHref && (
              <Link href={detail.targetHref} className="mp-btn" target="_blank">
                <ExternalLink size={13} />
                원문 보기
              </Link>
            )}
            {status === "open" && endpoint(detail) && (
              <button
                className="mp-btn mp-btn-danger"
                disabled={busy}
                onClick={() =>
                  deleting ? handleReport(true) : setDeleting(true)
                }
              >
                <Trash2 size={13} />
                {deleting ? "삭제 확인" : "콘텐츠 삭제"}
              </button>
            )}
            {!deleting && (
              <button
                className="mp-btn mp-btn-primary"
                disabled={busy}
                onClick={() => handleReport(false)}
              >
                {status === "open" ? <Check size={13} /> : <Undo2 size={13} />}
                {busy
                  ? "처리 중…"
                  : status === "open"
                    ? "처리 완료"
                    : "다시 열기"}
              </button>
            )}
            {deleting && (
              <button
                className="mp-btn"
                disabled={busy}
                onClick={() => setDeleting(false)}
              >
                취소
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
