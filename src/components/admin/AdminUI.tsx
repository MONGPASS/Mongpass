"use client";
import { useAdminText } from "./AdminLanguage";
import { AdminLanguage } from "./AdminLanguage";

import { AlertCircle, ChevronLeft, ChevronRight, Inbox, X } from "lucide-react";
import { useContext, useEffect, useRef } from "react";

export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mp-page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="mp-page-heading-actions">{children}</div>
    </div>
  );
}
export function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const t = useAdminText();
  return (
    <div className="mp-error" role="alert">
      <AlertCircle size={18} />
      <span>{t(message)}</span>
      {onRetry && <button onClick={onRetry}>{t("다시 시도")}</button>}
    </div>
  );
}
export function EmptyState({
  title = "표시할 내역이 없어요",
  description = "검색 조건을 변경하거나 새로운 등록을 기다려 주세요.",
}: {
  title?: string;
  description?: string;
}) {
  const t = useAdminText();
  return (
    <div className="mp-empty">
      <div>
        <Inbox size={25} strokeWidth={1.5} />
      </div>
      <b>{t(title)}</b>
      <p>{t(description)}</p>
    </div>
  );
}
export function Pagination({
  page,
  total,
  limit,
  onChange,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}) {
  const t = useAdminText();
  const language = useContext(AdminLanguage);
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="mp-pagination">
      <span>
        {language === "mn"
          ? `Нийт ${total.toLocaleString("mn-MN")}${total > 0 ? ` · ${(page - 1) * limit + 1}–${Math.min(page * limit, total)}` : ""}`
          : `총 ${total.toLocaleString()}건${total > 0 ? ` 중 ${(page - 1) * limit + 1}–${Math.min(page * limit, total)}건` : ""}`}
      </span>
      <div>
        <button
          aria-label={t("이전 페이지")}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        <b>
          {page} <span>/ {pages}</span>
        </b>
        <button
          aria-label={t("다음 페이지")}
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const t = useAdminText();
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input, textarea, select, [tabindex="0"]',
        ) ?? [],
      );
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key === "Tab") {
        const elements = focusable();
        if (event.shiftKey && document.activeElement === elements[0]) {
          event.preventDefault();
          elements[elements.length - 1]?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === elements[elements.length - 1]
        ) {
          event.preventDefault();
          elements[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="mp-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={`mp-modal ${wide ? "mp-modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={t(title)}
      >
        <div className="mp-modal-heading">
          <h2>{t(title)}</h2>
          <button
            className="mp-icon-button"
            aria-label={t("닫기")}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
