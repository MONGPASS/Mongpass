"use client";
import { adminFetch } from "@/lib/admin/types";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Star } from "lucide-react";
import { useBusiness } from "@/components/biz/BizContext";
import { formatDate } from "@/lib/admin/types";
import type { Review, ReviewsPage } from "@/lib/reviewStore";
import {
  EmptyState,
  ErrorNotice,
  Modal,
  PageHeading,
} from "@/components/admin/AdminUI";

export default function BusinessReviewsPage() {
  const { shop, request: customRequest } = useBusiness();
  const request = customRequest ?? adminFetch;
  const [data, setData] = useState<ReviewsPage | null>(null);
  const [cursor, setCursor] = useState("");
  const [previous, setPrevious] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [target, setTarget] = useState<Review | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [replyError, setReplyError] = useState("");
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        setData(
          await request<ReviewsPage>(
            "/api/reviews?" + new URLSearchParams({ shopId: shop.id, cursor }),
            { signal },
          ),
        );
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Үнэлгээг ачаалж чадсангүй.",
          );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [shop.id, cursor, request],
  );
  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  async function saveReply(remove = false) {
    if (!target || busy) return;
    if (remove && !confirm("Үнэлгээнд бичсэн хариуг устгах уу?")) return;
    setBusy(true);
    setReplyError("");
    try {
      await request(
        "/api/reviews/" + encodeURIComponent(target.id) + "/reply",
        remove
          ? { method: "DELETE" }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reply: reply.trim() }),
            },
      );
      setTarget(null);
      await refresh();
      window.dispatchEvent(new Event("biz-data-changed"));
    } catch {
      setReplyError("Хариуг хадгалж чадсангүй. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title={"Үнэлгээний удирдлага"}
        description={"Харилцагчийн сэтгэгдлийг сонсож, найрсаг хариу үлдээгээрэй."}
      >
        <span className="mp-btn">
          <Star size={14} color="#efa544" />
          {shop.avgRating ? shop.avgRating.toFixed(1) : "—"} · Үнэлгээ{" "}
          {shop.reviewCount ?? 0} ш
        </span>
      </PageHeading>
      {error && <ErrorNotice message={error} onRetry={() => refresh()} />}
      <section className="mp-panel mp-panel-pad">
        {loading ? (
          <div className="mp-loading" role="status">
            Үнэлгээг ачаалж байна…
          </div>
        ) : !data?.reviews.length ? (
          <EmptyState
            title={"Одоогоор үнэлгээ алга"}
            description={"Харилцагч үнэлгээ үлдээвэл эндээс хариу бичих боломжтой."}
          />
        ) : (
          data.reviews.map((review) => (
            <article key={review.id} className="mp-biz-review">
              <div className="mp-section-title">
                <div>
                  <b>{review.userName}</b>
                  <span
                    className="mp-biz-stars"
                    aria-label={`5-аас ${review.rating} оноо`}
                  >
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                <span className="mp-form-help">
                  {formatDate(review.createdAt, "mn-MN")}
                </span>
              </div>
              <p>{review.comment}</p>
              {review.reply && (
                <div className="mp-biz-reply">
                  <b>Бизнесийн хариу</b>
                  <p>{review.reply}</p>
                </div>
              )}
              <button
                className="mp-btn mp-btn-small"
                style={{ marginTop: 14 }}
                onClick={() => {
                  setTarget(review);
                  setReply(review.reply ?? "");
                  setReplyError("");
                }}
              >
                <MessageSquare size={12} />
                {review.reply ? "Хариу засах" : "Хариу бичих"}
              </button>
            </article>
          ))
        )}
        <div className="mp-pagination">
          <span>{previous.length + 1}-р хуудас</span>
          <div>
            <button
              disabled={!previous.length || loading}
              onClick={() => {
                setCursor(previous[previous.length - 1]);
                setPrevious(previous.slice(0, -1));
              }}
            >
              Өмнөх
            </button>
            <button
              disabled={!data?.nextCursor || loading}
              onClick={() => {
                setPrevious([...previous, cursor]);
                setCursor(data?.nextCursor ?? "");
              }}
            >
              Дараах
            </button>
          </div>
        </div>
      </section>
      {target && (
        <Modal
          title={"Үнэлгээнд хариу бичих"}
          onClose={() => {
            if (!busy) setTarget(null);
          }}
        >
          <p>
            <b>{target.userName}</b>
            <br />
            {target.comment}
          </p>
          {replyError && <ErrorNotice message={replyError} />}
          <textarea
            aria-label={"Үнэлгээний хариу"}
            maxLength={1000}
            value={reply}
            disabled={busy}
            onChange={(event) => setReply(event.target.value)}
            placeholder={"Харилцагчид харагдах хариугаа бичнэ үү."}
          />
          <div className="mp-modal-actions">
            {target.reply && (
              <button
                className="mp-btn mp-btn-danger"
                disabled={busy}
                onClick={() => saveReply(true)}
              >
                Хариу устгах
              </button>
            )}
            <button
              className="mp-btn"
              disabled={busy}
              onClick={() => setTarget(null)}
            >
              Цуцлах
            </button>
            <button
              className="mp-btn mp-btn-primary"
              disabled={busy || !reply.trim()}
              onClick={() => saveReply()}
            >
              {busy ? "Хадгалж байна…" : "Хариу хадгалах"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
