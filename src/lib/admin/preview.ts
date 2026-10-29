import type { Overview } from "./types";

// Explicit, isolated showcase data. Never used as a fallback for real admin requests.
export function createAdminPreview(): Overview {
  const today = new Date(
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }) +
      "T00:00:00+09:00",
  );
  const daily = Array.from({ length: 90 }, (_, index) => ({
    date: new Date(today.getTime() - (89 - index) * 86400000 + 9 * 3600000)
      .toISOString()
      .slice(0, 10),
    users: [24, 38, 32, 51, 43, 64, 58][index % 7],
    shops: [2, 4, 3, 6, 4, 8, 5][index % 7],
    orders: [42, 56, 49, 68, 62, 83, 75][index % 7],
    posts: [6, 12, 9, 16, 11, 19, 15][index % 7],
  }));
  return {
    generatedAt: new Date().toISOString(),
    days: 7,
    totals: {
      users: 2846,
      shops: 128,
      orders: 1532,
      posts: 386,
      pending: 8,
      reports: 3,
      banners: 4,
      featured: 12,
    },
    period: { users: 310, shops: 32, orders: 435, posts: 88 },
    previous: { users: 268, shops: 26, orders: 380, posts: 75 },
    daily,
    categories: [
      { category: "restaurant", count: 36 },
      { category: "cargo", count: 28 },
      { category: "beauty", count: 24 },
      { category: "hospital", count: 18 },
      { category: "other", count: 14 },
    ],
    pendingShops: [
      {
        id: "preview-1",
        ownerId: "sample-1",
        name: "Улаанбаатар ресторан",
        category: "restaurant",
        ownerName: "Бат-Эрдэнэ",
        ownerEmail: "sample@example.com",
        status: "pending",
        createdAt: daily[89].date + " 02:30:00",
      },
      {
        id: "preview-2",
        ownerId: "sample-2",
        name: "Монгол экспресс карго",
        category: "cargo",
        ownerName: "Саруул",
        ownerEmail: "sample@example.com",
        status: "pending",
        createdAt: daily[89].date + " 01:10:00",
      },
      {
        id: "preview-3",
        ownerId: "sample-3",
        name: "Bloom Beauty Studio",
        category: "beauty",
        ownerName: "Номин",
        ownerEmail: "sample@example.com",
        status: "pending",
        createdAt: daily[88].date + " 08:00:00",
      },
    ],
    news: [
      {
        id: "sample-news-1",
        title: "Mongpass 신규 업체 등록 안내",
        status: "published",
        createdAt: daily[89].date + " 00:00:00",
      },
      {
        id: "sample-news-2",
        title: "더 안전한 커뮤니티를 만들어요",
        status: "published",
        createdAt: daily[87].date + " 00:00:00",
      },
      {
        id: "sample-news-3",
        title: "이웃과 함께하는 가을 이벤트",
        status: "draft",
        createdAt: daily[86].date + " 00:00:00",
      },
    ],
  };
}
