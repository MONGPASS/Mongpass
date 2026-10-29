"use client";
import OrdersWorkspace from "@/components/admin/OrdersWorkspace";
import { useBusiness } from "@/components/biz/BizContext";
export default function BusinessOrdersPage() {
  const { shop, request } = useBusiness();
  return <OrdersWorkspace businessShop={shop} request={request} />;
}
