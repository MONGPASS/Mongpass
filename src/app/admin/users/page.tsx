"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Search, ShieldCheck, Undo2 } from "lucide-react";
import { adminFetch, formatDate } from "@/lib/admin/types";
import {
  EmptyState,
  ErrorNotice,
  Modal,
  PageHeading,
  Pagination,
} from "@/components/admin/AdminUI";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  banned: boolean;
  bannedReason?: string;
  createdAt: string;
}
interface UsersPage {
  users: AdminUser[];
  page: number;
  limit: number;
  total: number;
}
export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState("");
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
        setData(
          await adminFetch<UsersPage>(
            "/api/admin/users?" +
              new URLSearchParams({ q: query, status, page: String(page) }),
            { signal },
          ),
        );
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "회원 목록을 불러오지 못했어요.",
          );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [query, status, page],
  );
  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  async function changeBan() {
    if (!target || busy) return;
    setBusy(true);
    try {
      await adminFetch(`/api/users/${encodeURIComponent(target.id)}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned: !target.banned, reason: reason.trim() }),
      });
      setTarget(null);
      await refresh();
      setMessage(
        target.banned
          ? "회원 이용 제한을 해제했습니다."
          : "회원 이용을 제한했습니다. 기존 로그인 세션도 해제됩니다.",
      );
    } catch (cause) {
      setTarget(null);
      setError(cause instanceof Error ? cause.message : "변경하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="회원 관리"
        description="회원 정보를 검색하고, 안전한 커뮤니티를 위해 이용 상태를 관리해요."
      />
      {error && <ErrorNotice message={error} onRetry={() => refresh()} />}
      {message && (
        <div className="mp-success" role="status">
          {message}
        </div>
      )}
      <section className="mp-panel" aria-busy={loading}>
        <div className="mp-tabs" role="group" aria-label="회원 상태">
          {[
            { value: "all", label: "전체 회원" },
            { value: "active", label: "이용 중" },
            { value: "banned", label: "이용 제한" },
            { value: "admin", label: "관리자" },
          ].map((tab) => (
            <button
              key={tab.value}
              aria-pressed={status === tab.value}
              className={status === tab.value ? "active" : ""}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mp-toolbar">
          <label className="mp-search-input">
            <Search size={15} />
            <input
              aria-label="회원 이름 또는 이메일 검색"
              placeholder="회원 이름 또는 이메일 검색"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </label>
        </div>
        {loading ? (
          <div className="mp-loading" role="status">
            회원 목록을 불러오고 있어요…
          </div>
        ) : !data?.users.length ? (
          <EmptyState title="조건에 맞는 회원이 없어요" />
        ) : (
          <div className="mp-table-scroll">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>회원</th>
                  <th>이메일</th>
                  <th>가입일</th>
                  <th>역할</th>
                  <th>이용 상태</th>
                  <th style={{ textAlign: "right" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      {user.role === "admin" ? (
                        <span className="mp-status">
                          <ShieldCheck size={11} />
                          관리자
                        </span>
                      ) : (
                        "일반 회원"
                      )}
                    </td>
                    <td>
                      <span
                        className={`mp-status ${user.banned ? "rejected" : "approved"}`}
                      >
                        {user.banned ? "이용 제한" : "이용 중"}
                      </span>
                      {user.bannedReason && (
                        <p
                          title={user.bannedReason}
                          style={{
                            maxWidth: 160,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {user.bannedReason}
                        </p>
                      )}
                    </td>
                    <td>
                      <div className="mp-row-actions">
                        {user.role !== "admin" && (
                          <button
                            className={`mp-btn mp-btn-small ${user.banned ? "" : "mp-btn-danger"}`}
                            disabled={busy}
                            onClick={() => {
                              setTarget(user);
                              setReason("");
                              setMessage("");
                            }}
                          >
                            {user.banned ? (
                              <Undo2 size={12} />
                            ) : (
                              <Ban size={12} />
                            )}
                            {user.banned ? "제한 해제" : "이용 제한"}
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
      {target && (
        <Modal
          title={
            target.banned
              ? "이용 제한을 해제할까요?"
              : "회원 이용을 제한할까요?"
          }
          onClose={() => {
            if (!busy) setTarget(null);
          }}
        >
          <p>
            <b>{target.name}</b> ({target.email})<br />
            {target.banned
              ? "이 회원이 다시 로그인하고 서비스를 이용할 수 있습니다."
              : "이 회원의 로그인 세션이 종료되며, 다시 로그인할 수 없습니다. 제한 사유를 입력해 주세요."}
          </p>
          {!target.banned && (
            <textarea
              aria-label="이용 제한 사유"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={1000}
              placeholder="운영 정책 위반 내용을 입력해 주세요."
            />
          )}
          <div className="mp-modal-actions">
            <button
              className="mp-btn"
              disabled={busy}
              onClick={() => setTarget(null)}
            >
              취소
            </button>
            <button
              className={`mp-btn ${target.banned ? "mp-btn-primary" : "mp-btn-danger"}`}
              disabled={busy || (!target.banned && !reason.trim())}
              onClick={changeBan}
            >
              {busy ? "처리 중…" : target.banned ? "제한 해제" : "이용 제한"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
