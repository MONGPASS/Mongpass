'use client';

import { ArrowLeft, Plane, Zap, Package, Pizza, Stethoscope, Scissors, ShoppingBag, Beef } from "lucide-react";
import { parseTimestamp } from "@/lib/datetime";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BeautyAppointment,
  CargoOrder,
  HospitalAppointment,
  MeatOrder,
  Order,
  OrderStatus,
  RestaurantOrder,
  TravelBooking,
  formatPrice,
  getStatusLabel,
} from "@/lib/orderStore";
import { ShopCategory } from "@/components/shop/types";
import { CargoType } from "@/lib/cargoStore";
import { loadOrders } from "@/lib/orderStore";

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  received: "bg-blue-100 text-blue-700",
  in_transit: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const CARGO_TYPE_ICON: Record<CargoType, typeof Plane> = {
  air: Plane,
  express: Zap,
  regular: Package,
};

function fmtDateTime(iso: string): string {
  const d = parseTimestamp(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function StatusBadge({ category, status }: { category: ShopCategory; status: OrderStatus }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_BADGE[status]}`}>
      {getStatusLabel(category, status)}
    </span>
  );
}

function CargoCard({ order }: { order: CargoOrder }) {
  const Icon = CARGO_TYPE_ICON[order.routeSnapshot.type];
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Карго · {fmtDateTime(order.createdAt)}
            </span>
            <StatusBadge category={order.shopCategory} status={order.status} />
          </div>
          <p className="font-bold text-sm text-gray-900">
            {order.routeSnapshot.fromCity} → {order.routeSnapshot.toCity}
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {order.item.description} · {order.item.weight}кг ·{" "}
            <span className="font-bold text-gray-900">{order.estimatedPrice}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function RestaurantCard({ order }: { order: RestaurantOrder }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
          <Pizza className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Хоол · {fmtDateTime(order.createdAt)}
            </span>
            <StatusBadge category={order.shopCategory} status={order.status} />
          </div>
          <p className="font-bold text-sm text-gray-900 mb-1">
            {order.items.length} зүйл ·{" "}
            <span className="text-gray-900">{formatPrice(order.subtotalAmount)}</span>
          </p>
          <p className="text-[11px] text-gray-500 truncate">
            {order.items.map((i) => `${i.name}×${i.qty}`).join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}

function HospitalCard({ order }: { order: HospitalAppointment }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500 shrink-0">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Эмнэлэг · {fmtDateTime(order.createdAt)}
            </span>
            <StatusBadge category={order.shopCategory} status={order.status} />
          </div>
          <p className="font-bold text-sm text-gray-900">{order.doctorSnapshot.name}</p>
          <p className="text-[11px] text-gray-500 mb-1">{order.doctorSnapshot.department}</p>
          <p className="text-[12px] text-gray-700 font-semibold">
            📅 {order.preferredDate} · ⏰ {order.preferredTime}
          </p>
        </div>
      </div>
    </div>
  );
}

function BeautyCard({ order }: { order: BeautyAppointment }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500 shrink-0">
          <Scissors className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Гоо сайхан · {fmtDateTime(order.createdAt)}
            </span>
            <StatusBadge category={order.shopCategory} status={order.status} />
          </div>
          <p className="font-bold text-sm text-gray-900">{order.serviceSnapshot.name}</p>
          <p className="text-[11px] text-gray-500 mb-1">
            {order.serviceSnapshot.durationMin} мин · {order.serviceSnapshot.price}
            {order.stylistName && ` · ${order.stylistName}`}
          </p>
          <p className="text-[12px] text-gray-700 font-semibold">
            📅 {order.preferredDate} · ⏰ {order.preferredTime}
          </p>
        </div>
      </div>
    </div>
  );
}

function MeatCard({ order }: { order: MeatOrder }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
          <Beef className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Мах · {fmtDateTime(order.createdAt)}
            </span>
            <StatusBadge category={order.shopCategory} status={order.status} />
          </div>
          <p className="font-bold text-sm text-gray-900 mb-1">
            {order.items.length} зүйл ·{" "}
            <span className="text-primary">{formatPrice(order.totalAmount)}</span>
          </p>
          <p className="text-[11px] text-gray-500 truncate">
            {order.items.map((i) => `${i.name}×${i.qty}`).join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}

function TravelCard({ order }: { order: TravelBooking }) {
  const total = order.travelers.adults + order.travelers.children;
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
          <Plane className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Аялал · {fmtDateTime(order.createdAt)}
            </span>
            <StatusBadge category={order.shopCategory} status={order.status} />
          </div>
          <p className="font-bold text-sm text-gray-900 mb-0.5">
            {order.packageSnapshot.title}
          </p>
          <p className="text-[11px] text-gray-500 mb-1">
            👥 {total} хүн ({order.travelers.adults} том, {order.travelers.children} хүүхэд)
          </p>
          <p className="text-[12px] text-gray-700 font-semibold">
            📅 {order.preferredDate}
          </p>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  switch (order.shopCategory) {
    case "cargo":
      return <CargoCard order={order} />;
    case "restaurant":
    case "food":
      return <RestaurantCard order={order} />;
    case "hospital":
      return <HospitalCard order={order} />;
    case "beauty":
      return <BeautyCard order={order} />;
    case "meat":
      return <MeatCard order={order} />;
    case "travel":
      return <TravelCard order={order} />;
    default:
      return null;
  }
}

type TabKey = "all" | "active" | "done";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<TabKey>("all");

  useEffect(() => {
    let active = true;
    loadOrders({ mine: true }).then((list) => {
      if (active) setOrders(list);
    });
    return () => { active = false; };
  }, []);

  const sorted = [...orders].sort(
    (a, b) => parseTimestamp(b.createdAt).getTime() - parseTimestamp(a.createdAt).getTime(),
  );
  const visible = sorted.filter((o) => {
    if (tab === "all") return true;
    if (tab === "active") return o.status === "pending" || o.status === "received" || o.status === "in_transit";
    return o.status === "delivered" || o.status === "cancelled";
  });

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Захиалгын түүх</h1>
        </div>
        <div className="flex border-b border-gray-100">
          {(["all", "active", "done"] as TabKey[]).map((k) => {
            const label = k === "all" ? "Бүгд" : k === "active" ? "Идэвхтэй" : "Дууссан";
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`flex-1 py-3 text-sm font-bold ${tab === k ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-400"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-4 pt-4 space-y-3">
        {visible.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-500">
              {orders.length === 0 ? "Захиалгын түүх хоосон байна" : "Энэ ангилалд захиалга байхгүй"}
            </p>
            {orders.length === 0 && (
              <Link
                href="/"
                className="inline-block mt-4 bg-gray-900 text-white font-semibold px-5 py-2 rounded-xl text-sm"
              >
                Хайж эхлэх
              </Link>
            )}
          </div>
        )}
        {visible.map((order) => (
          <Link
            key={order.id}
            href={`/profile/orders/${order.id}`}
            className="block active:scale-[0.99] transition-transform"
          >
            <OrderCard order={order} />
          </Link>
        ))}
      </div>
    </main>
  );
}
