import type { Shop } from "@/lib/shopStore";

export interface BusinessOverview {
  generatedAt: string;
  days: number;
  shop: Shop;
  totals: {
    orders: number;
    chats: number;
    favorites: number;
    reviews: number;
    pending: number;
    unread: number;
    rating: number;
    unreplied: number;
  };
  daily: Array<{
    date: string;
    orders: number;
    chats: number;
    favorites: number;
    reviews: number;
  }>;
  recentOrders: BusinessOrder[];
}
export interface BusinessOrder {
  id: string;
  category: string;
  status: string;
  createdAt: string;
  shopName: string;
  customerName: string;
  payload: string;
}
