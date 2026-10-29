import { createAdminPreview } from "./preview";
import type { BusinessOverview } from "./business";

export function createBusinessPreviewOverview(): BusinessOverview {
  const sample = createAdminPreview();
  const data: BusinessOverview = {
    generatedAt: sample.generatedAt,
    days: 7,
    shop: {
      id: "sample-business",
      ownerId: "sample-owner",
      name: "Улаанбаатар ресторан",
      category: "restaurant",
      status: "approved",
      isOpen: true,
      description: "Солонгост байгаа Монгол амт",
      contactPhone: "010-0000-0000",
      address: "서울특별시 중구",
      openHours: "11:00–22:00",
      createdAt: sample.generatedAt,
    },
    totals: {
      orders: 284,
      chats: 68,
      favorites: 152,
      reviews: 38,
      pending: 5,
      unread: 3,
      rating: 4.8,
      unreplied: 2,
    },
    daily: sample.daily.map((day) => ({
      date: day.date,
      orders: day.shops,
      chats: Math.floor(day.users / 10),
      favorites: Math.floor(day.posts / 3),
      reviews: Math.floor(day.shops / 3),
    })),
    recentOrders: [
      {
        id: "ORD-20261022-003",
        category: "restaurant",
        status: "pending",
        customerName: "Бат-Эрдэнэ",
        shopName: "Улаанбаатар ресторан",
        createdAt: sample.generatedAt,
        payload: "{}",
      },
      {
        id: "ORD-20261022-002",
        category: "restaurant",
        status: "received",
        customerName: "Номин",
        shopName: "Улаанбаатар ресторан",
        createdAt: sample.generatedAt,
        payload: "{}",
      },
      {
        id: "ORD-20261022-001",
        category: "restaurant",
        status: "delivered",
        customerName: "Саруул",
        shopName: "Улаанбаатар ресторан",
        createdAt: sample.generatedAt,
        payload: "{}",
      },
    ],
  };
  return data;
}
