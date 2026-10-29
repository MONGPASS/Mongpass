import type { Shop } from "@/lib/shopStore";

export type AdminShop = Shop & { ownerName: string; ownerEmail: string };
export type Metric = "users" | "shops" | "orders" | "posts";
export interface Overview {
  generatedAt: string;
  days: number;
  totals: Record<Metric, number> & {
    pending: number;
    reports: number;
    banners: number;
    featured: number;
  };
  period: Record<Metric, number>;
  previous: Record<Metric, number>;
  daily: Array<{ date: string } & Record<Metric, number>>;
  categories: Array<{ category: string; count: number }>;
  pendingShops: AdminShop[];
  news: Array<{ id: string; title: string; createdAt: string; status: string }>;
}

export const CATEGORY_KO: Record<string, string> = {
  restaurant: "음식점",
  food: "식품",
  meat: "정육·식료품",
  cargo: "배송·화물",
  hospital: "병원",
  beauty: "뷰티",
  car: "중고차",
  travel: "여행",
  other: "기타",
};
export const STATUS_KO = {
  pending: "승인 대기",
  approved: "승인 완료",
  rejected: "반려",
};
export const ORDER_KO: Record<string, string> = {
  pending: "접수 대기",
  received: "접수 완료",
  in_transit: "진행 중",
  delivered: "완료",
  cancelled: "취소",
};

export async function adminFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "로그인이 필요합니다."
        : response.status === 403
          ? "관리자 권한이 필요합니다."
          : "데이터를 불러오지 못했습니다. 다시 시도해 주세요.",
    );
  }
  return response.json() as Promise<T>;
}

export function exportCsv(name: string, rows: (string | number)[][]) {
  // Neutralize spreadsheet formulas in user-authored cells.
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell);
          return (
            '"' +
            (/^[\s]*[=+@-]/.test(value) ? "'" + value : value).replace(
              /"/g,
              '""',
            ) +
            '"'
          );
        })
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatDate(value: string, locale = "ko-KR") {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(
    new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z"),
  );
}
