"use client";
import { useAdminText } from "./AdminLanguage";
import { CATEGORY_MN, ORDER_MN } from "@/lib/admin/businessMessages";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Download, Search } from "lucide-react";
import {
  adminFetch,
  CATEGORY_KO,
  exportCsv,
  formatDate,
  ORDER_KO,
} from "@/lib/admin/types";
import {
  EmptyState,
  ErrorNotice,
  Modal,
  PageHeading,
  Pagination,
} from "@/components/admin/AdminUI";

import type { Shop } from "@/lib/shopStore";
import { getStatusFlow } from "@/lib/orderStore";

interface Order {
  id: string;
  category: string;
  status: string;
  createdAt: string;
  shopName: string;
  customerName: string;
  payload: string;
}
interface OrderPage {
  orders: Order[];
  page: number;
  limit: number;
  total: number;
}
export default function OrdersWorkspace({
  businessShop,
  request = adminFetch,
}: {
  businessShop?: Shop;
  request?: typeof adminFetch;
}) {
  const t = useAdminText();
  const categoryNames = businessShop ? CATEGORY_MN : CATEGORY_KO;
  const orderStates = businessShop ? ORDER_MN : ORDER_KO;
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OrderPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState("pending");
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get("q") ?? "");
  }, []);
  function openOrder(order: Order) {
    setDetail(order);
    setNextStatus(order.status);
    setStatusError("");
  }
  async function saveStatus() {
    if (!detail || saving) return;
    setSaving(true);
    setStatusError("");
    try {
      await request(
        "/api/orders/" + encodeURIComponent(detail.id) + "/status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        },
      );
      setDetail({ ...detail, status: nextStatus });
      await refresh();
      window.dispatchEvent(new Event("biz-data-changed"));
    } catch {
      setStatusError(t("진행 상태를 변경하지 못했습니다. 다시 시도해 주세요."));
    } finally {
      setSaving(false);
    }
  }
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
          await request<OrderPage>(
            (businessShop ? "/api/biz/orders?" : "/api/admin/orders?") +
              new URLSearchParams({
                q: query,
                category,
                status,
                page: String(page),
              }),
            { signal },
          ),
        );
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : t("주문을 불러오지 못했어요."),
          );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [query, category, status, page, businessShop, request, t],
  );
  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  return (
    <>
      <PageHeading
        title={businessShop ? t("주문·예약 관리") : t("주문·예약")}
        description={
          businessShop
            ? t("우리 업체로 들어온 주문과 예약을 확인하고, 진행 상태를 관리해 주세요.")
            : t("전체 업체의 주문과 예약 진행 상황을 확인해요. 접수와 상태 변경은 각 업체에서 진행합니다.")
        }
      >
        <button
          className="mp-btn"
          disabled={!data?.orders.length || loading}
          onClick={() =>
            exportCsv(t("mongpass-주문-현재페이지.csv"), [
              [t("주문번호"), t("업체"), t("고객"), t("카테고리"), t("상태"), t("등록일")],
              ...(data?.orders ?? []).map((order) => [
                order.id,
                order.shopName,
                order.customerName,
                categoryNames[order.category],
                orderStates[order.status],
                formatDate(order.createdAt, businessShop ? "mn-MN" : "ko-KR"),
              ]),
            ])
          }
        >
          <Download size={14} />
          {t("현재 페이지 내보내기")}
        </button>
      </PageHeading>
      {error && <ErrorNotice message={error} onRetry={() => refresh()} />}
      <section className="mp-panel" aria-busy={loading}>
        <div className="mp-tabs" role="group" aria-label={t("주문 상태")}>
          {[["all", t("전체 내역")], ...Object.entries(orderStates)].map(
            ([value, label]) => (
              <button
                key={value}
                aria-pressed={status === value}
                className={status === value ? "active" : ""}
                onClick={() => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                {label}
              </button>
            ),
          )}
        </div>
        <div className="mp-toolbar">
          <label className="mp-search-input">
            <Search size={15} />
            <input
              aria-label={t("주문번호, 업체 또는 고객 검색")}
              placeholder={t("주문번호, 업체 또는 고객 검색")}
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </label>
          <select
            aria-label={t("주문 카테고리")}
            hidden={!!businessShop}
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("전체 카테고리")}</option>
            {Object.entries(categoryNames).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="mp-loading" role="status">
            {t("주문을 불러오고 있어요…")}
          </div>
        ) : !data?.orders.length ? (
          <EmptyState title={t("조건에 맞는 주문·예약이 없어요")} />
        ) : (
          <>
          {businessShop && <div className="mp-mobile-order-list">
            {data.orders.map((order) => <button className="mp-mobile-order" key={order.id} onClick={() => openOrder(order)}>
              <span className="mp-mobile-order-top"><strong>{order.customerName}</strong><span className={`mp-status ${order.status}`}>{orderStates[order.status]}</span></span>
              <span className="mp-mobile-order-id">#{order.id}</span>
              <span className="mp-mobile-order-bottom"><time>{formatDate(order.createdAt, "mn-MN")}</time><span>Дэлгэрэнгүй <ChevronRight size={15} /></span></span>
            </button>)}
          </div>}
          <div className={`mp-table-scroll${businessShop ? " mp-business-orders-table" : ""}`}>
            <table className="mp-table">
              <thead>
                <tr>
                  <th>{t("주문번호")}</th>
                  <th>{t("업체")}</th>
                  <th>{t("카테고리")}</th>
                  <th>{t("고객")}</th>
                  <th>{t("주문일")}</th>
                  <th>{t("진행 상태")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <button
                        className="mp-row-link"
                        onClick={() => openOrder(order)}
                      >
                        {order.id.length > 23
                          ? order.id.slice(0, 23) + "…"
                          : order.id}
                      </button>
                    </td>
                    <td>
                      <strong>{order.shopName}</strong>
                    </td>
                    <td>{categoryNames[order.category] ?? order.category}</td>
                    <td>{order.customerName}</td>
                    <td>{formatDate(order.createdAt, businessShop ? "mn-MN" : "ko-KR")}</td>
                    <td>
                      <span className={`mp-status ${order.status}`}>
                        {orderStates[order.status]}
                      </span>
                    </td>
                    <td>
                      <button
                        className="mp-btn mp-btn-small"
                        onClick={() => openOrder(order)}
                      >
                        {t("상세")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
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
          wide
          title={t("주문·예약 상세")}
          onClose={() => {
            if (!saving) setDetail(null);
          }}
        >
          <p>{detail.id}</p>
          <dl className="mp-detail-grid">
            <dt>{t("업체")}</dt>
            <dd>{detail.shopName}</dd>
            <dt>{t("고객")}</dt>
            <dd>{detail.customerName}</dd>
            <dt>{t("진행 상태")}</dt>
            <dd>
              <span className={`mp-status ${detail.status}`}>
                {orderStates[detail.status]}
              </span>
            </dd>
            <dt>{t("등록일")}</dt>
            <dd>{formatDate(detail.createdAt, businessShop ? "mn-MN" : "ko-KR")}</dd>
          </dl>
          {businessShop && (
            <div
              style={{
                borderTop: "1px solid #eee",
                paddingTop: 20,
                marginTop: 20,
              }}
            >
              <label
                style={{ display: "block", marginBottom: 8, fontSize: 12 }}
              >
                {t("주문 진행 상태")}
              </label>
              <select
                aria-label={t("변경할 주문 상태")}
                value={nextStatus}
                disabled={saving}
                onChange={(event) => setNextStatus(event.target.value)}
              >
                {[...getStatusFlow(businessShop.category), "cancelled"].map(
                  (value) => (
                    <option key={value} value={value}>
                      {orderStates[value]}
                    </option>
                  ),
                )}
              </select>
              <button
                className="mp-btn mp-btn-primary"
                style={{ marginLeft: 8 }}
                disabled={saving || nextStatus === detail.status}
                onClick={saveStatus}
              >
                {saving ? t("저장 중…") : t("상태 변경")}
              </button>
              {statusError && (
                <div style={{ marginTop: 12 }}>
                  <ErrorNotice message={statusError} />
                </div>
              )}
            </div>
          )}
          <OrderDetails payload={detail.payload} />
          <div className="mp-modal-actions">
            <button
              className="mp-btn"
              disabled={saving}
              onClick={() => setDetail(null)}
            >
              {t("닫기")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function OrderDetails({ payload }: { payload: string }) {
  const t = useAdminText();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return <p>{t("상세 정보를 표시할 수 없습니다.")}</p>;
  }
  const labels: Record<string, string> = {
    name: t("이름"),
    phone: t("연락처"),
    address: t("주소"),
    date: t("날짜"),
    time: t("시간"),
    note: t("요청 사항"),
    memo: t("메모"),
    total: t("합계"),
    totalPrice: t("총 금액"),
    totalAmount: t("총 금액"),
    deliveryFee: t("배송비"),
    items: t("주문 상품"),
    quantity: t("수량"),
    price: t("가격"),
    customerName: t("고객명"),
    customerPhone: t("연락처"),
    deliveryAddress: t("배송 주소"),
    category: t("서비스"),
    doctorName: t("의사"),
    serviceName: t("서비스명"),
    packageTitle: t("여행 상품"),
    bookingDate: t("예약일"),
    bookingTime: t("예약 시간"),
    title: t("상품명"),
    qty: t("수량"),
    unit: t("단위"),
    subtotalAmount: t("상품 금액"),
    bankAccountSnapshot: t("입금 안내"),
    customer: t("고객 정보"),
    patient: t("예약자 정보"),
    sender: t("보내는 분"),
    receiver: t("받는 분"),
    routeSnapshot: t("배송 노선"),
    fromCity: t("출발 지역"),
    toCity: t("도착 지역"),
    pricePerKg: t("kg당 요금"),
    estimatedPrice: t("예상 요금"),
    item: t("화물 정보"),
    description: t("설명"),
    weight: t("무게"),
    dimensions: t("크기"),
    doctorSnapshot: t("담당 의사"),
    department: t("진료과"),
    symptom: t("증상"),
    preferredDate: t("희망 날짜"),
    preferredTime: t("희망 시간"),
    serviceSnapshot: t("예약 서비스"),
    durationMin: t("소요 시간(분)"),
    stylistName: t("담당자"),
    packageSnapshot: t("여행 상품"),
    duration: t("여행 기간"),
    travelers: t("여행 인원"),
    adults: t("성인"),
    children: t("어린이"),
    email: t("이메일"),
    notes: t("요청 사항"),
    type: t("종류"),
    imageDataUrl: t("화물 사진"),
  };
  function display(value: unknown): React.ReactNode {
    if (value === null || value === undefined || value === "") return "—";
    if (Array.isArray(value))
      return value.map((item, index) => (
        <div key={index} style={{ marginBottom: 12 }}>
          {display(item)}
        </div>
      ));
    if (typeof value === "object")
      return (
        <dl className="mp-detail-grid" style={{ marginTop: 8 }}>
          {Object.entries(value)
            .filter(
              ([key]) => !!labels[key] && !/Id$|^id$|imageR2Key/.test(key),
            )
            .map(([key, item]) => (
              <div key={key} style={{ display: "contents" }}>
                <dt>{labels[key] ?? key}</dt>
                <dd>
                  {key === "imageDataUrl" &&
                  typeof item === "string" &&
                  /^(https?:\/\/|data:image\/|\/)/.test(item) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item}
                      alt={t("등록된 화물 사진")}
                      style={{
                        maxWidth: "100%",
                        maxHeight: 220,
                        borderRadius: 7,
                      }}
                    />
                  ) : (
                    display(item)
                  )}
                </dd>
              </div>
            ))}
        </dl>
      );
    return String(value);
  }
  return (
    <div style={{ borderTop: "1px solid #eee", marginTop: 20, paddingTop: 10 }}>
      {display(parsed)}
    </div>
  );
}
