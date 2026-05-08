/**
 * Convert between the D1 `orders` row shape (a few core columns + a
 * payload_json blob holding the category-specific body) and the
 * discriminated-union `Order` type the client code uses.
 */

import type { Order, OrderStatus } from "@/lib/orderStore";
import type { ShopCategory } from "@/components/shop/types";

export interface OrderRow {
  id: string;
  shop_id: string;
  customer_user_id: string;
  category: string;
  status: OrderStatus;
  status_updated_at: string | null;
  created_at: string;
  payload_json: string;
}

export function rowToOrder(row: OrderRow): Order {
  // payload_json holds everything except {id, shopCategory, shopId,
  // createdAt, status, statusUpdatedAt} — those come from the columns.
  const payload = JSON.parse(row.payload_json) as Record<string, unknown>;
  return {
    ...payload,
    id: row.id,
    shopId: row.shop_id,
    shopCategory: row.category as ShopCategory,
    status: row.status,
    statusUpdatedAt: row.status_updated_at ?? undefined,
    createdAt: row.created_at,
  } as Order;
}

/**
 * Strip the columns that live outside payload_json and return the JSON
 * string we'll persist. Keeps the canonical Order shape on the client
 * while letting D1 query/filter on shop_id, status, category, etc.
 */
export function orderToPayloadJson(order: Order): string {
  const { id: _id, shopId: _s, shopCategory: _c, status: _st, statusUpdatedAt: _su, createdAt: _ca, ...rest } = order;
  void _id; void _s; void _c; void _st; void _su; void _ca;
  return JSON.stringify(rest);
}
