'use client';

import { ArrowLeft, Plane, Zap, Package, Pizza, Stethoscope, Scissors } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BeautyAppointment,
  CargoOrder,
  HospitalAppointment,
  Order,
  OrderStatus,
  RestaurantOrder,
  formatPrice,
  getStatusFlow,
  getStatusLabel,
  loadOrders,
} from "@/lib/orderStore";
import { ShopCategory } from "@/components/shop/types";
import { CargoType } from "@/lib/cargoStore";

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

function fmtFull(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function StatusTimeline({ category, status }: { category: ShopCategory; status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <span className="text-sm font-bold text-gray-500">Цуцлагдсан</span>
      </div>
    );
  }
  const flow = getStatusFlow(category);
  const currentIdx = flow.indexOf(status);
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        {flow.map((s, i) => {
          const reached = i <= currentIdx;
          return (
            <div key={s} className="flex-1 flex flex-col items-center min-w-0">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div className={`flex-1 h-0.5 ${reached ? "bg-green-500" : "bg-gray-200"}`} />
                )}
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${reached ? "bg-green-500" : "bg-gray-300"}`}
                />
                {i < flow.length - 1 && (
                  <div className={`flex-1 h-0.5 ${i < currentIdx ? "bg-green-500" : "bg-gray-200"}`} />
                )}
              </div>
              <span
                className={`text-[10px] font-medium mt-1.5 text-center px-1 truncate ${reached ? "text-gray-900 font-bold" : "text-gray-400"}`}
              >
                {getStatusLabel(category, s)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm p-4">
      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline gap-3 py-1.5 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium text-right break-all">{value}</span>
    </div>
  );
}

function CargoDetail({ order }: { order: CargoOrder }) {
  const Icon = CARGO_TYPE_ICON[order.routeSnapshot.type];
  return (
    <>
      <Section title="Чиглэл">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-base text-gray-900">
              {order.routeSnapshot.fromCity} → {order.routeSnapshot.toCity}
            </p>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {order.routeSnapshot.pricePerKg} / кг
            </p>
          </div>
        </div>
      </Section>

      <Section title="Илгээх ачаа">
        {order.item.imageDataUrl && (
          <img
            src={order.item.imageDataUrl}
            alt="ачаа"
            className="w-full max-h-60 object-cover rounded-xl border border-gray-100 mb-3"
          />
        )}
        <Row label="Тайлбар" value={order.item.description} />
        <Row label="Жин" value={`${order.item.weight} кг`} />
        {order.item.dimensions && <Row label="Хэмжээ" value={`${order.item.dimensions} см`} />}
      </Section>

      <Section title="Илгээгч (Korea)">
        <Row label="Нэр" value={order.sender.name} />
        <Row label="Утас" value={order.sender.phone} />
        {order.sender.address && <Row label="Ачаа авах хаяг" value={order.sender.address} />}
      </Section>

      <Section title="Хүлээн авагч (Mongolia)">
        <Row label="Нэр" value={order.receiver.name} />
        <Row label="Утас" value={order.receiver.phone} />
        {order.receiver.address && <Row label="Монгол хаяг" value={order.receiver.address} />}
      </Section>

      <Section title="Үнэ">
        <Row
          label={`${order.item.weight}кг × ${order.routeSnapshot.pricePerKg}/кг`}
          value={<span className="font-bold text-base text-gray-900">{order.estimatedPrice}</span>}
        />
      </Section>
    </>
  );
}

function RestaurantDetail({ order }: { order: RestaurantOrder }) {
  return (
    <>
      <Section title="Сонгосон зүйлс">
        <div className="divide-y divide-gray-100">
          {order.items.map((it) => (
            <div key={it.itemId} className="py-2 flex items-baseline justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {it.category}
                </p>
                <p className="text-gray-900 font-medium truncate">
                  {it.name} <span className="text-gray-400">×{it.qty}</span>
                </p>
              </div>
              <span className="text-gray-700 shrink-0">{it.price}</span>
            </div>
          ))}
          <div className="pt-3 flex justify-between items-baseline">
            <span className="text-sm font-bold text-gray-700">Нийт</span>
            <span className="font-bold text-base text-gray-900">{formatPrice(order.subtotalAmount)}</span>
          </div>
        </div>
      </Section>

      <Section title="Хүргэх мэдээлэл">
        <Row label="Нэр" value={order.customer.name} />
        <Row label="Утас" value={order.customer.phone} />
        <Row label="Хаяг" value={order.customer.address} />
        {order.notes && <Row label="Тэмдэглэл" value={order.notes} />}
      </Section>
    </>
  );
}

function HospitalDetail({ order }: { order: HospitalAppointment }) {
  return (
    <>
      <Section title="Эмч">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500 shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {order.doctorSnapshot.department}
            </p>
            <p className="font-bold text-base text-gray-900">{order.doctorSnapshot.name}</p>
          </div>
        </div>
      </Section>

      <Section title="Цаг">
        <Row label="Огноо" value={order.preferredDate} />
        <Row label="Цаг" value={order.preferredTime} />
      </Section>

      <Section title="Үйлчлүүлэгч">
        <Row label="Нэр" value={order.patient.name} />
        <Row label="Утас" value={order.patient.phone} />
        {order.patient.age && <Row label="Нас" value={`${order.patient.age} нас`} />}
        {order.symptom && <Row label="Зовиур" value={order.symptom} />}
      </Section>
    </>
  );
}

function BeautyDetail({ order }: { order: BeautyAppointment }) {
  return (
    <>
      <Section title="Үйлчилгээ">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500 shrink-0">
            <Scissors className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-gray-900">{order.serviceSnapshot.name}</p>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {order.serviceSnapshot.durationMin} мин · <b className="text-gray-900">{order.serviceSnapshot.price}</b>
            </p>
          </div>
        </div>
      </Section>

      {order.stylistName && (
        <Section title="Стилист">
          <p className="text-sm text-gray-900 font-medium">{order.stylistName}</p>
        </Section>
      )}

      <Section title="Цаг">
        <Row label="Огноо" value={order.preferredDate} />
        <Row label="Цаг" value={order.preferredTime} />
      </Section>

      <Section title="Холбоо барих">
        <Row label="Нэр" value={order.customer.name} />
        <Row label="Утас" value={order.customer.phone} />
        {order.notes && <Row label="Тэмдэглэл" value={order.notes} />}
      </Section>
    </>
  );
}

function CategoryHeader({ order }: { order: Order }) {
  // Only categories that can produce orders appear here (Order is a
  // discriminated union scoped to transactional categories). Adding
  // entries for meat/car/travel/other would be unreachable code.
  const meta: Record<Order["shopCategory"], { label: string; bg: string; text: string }> = {
    cargo: { label: "Карго", bg: "bg-blue-50", text: "text-blue-600" },
    restaurant: { label: "Хоол", bg: "bg-orange-50", text: "text-orange-600" },
    food: { label: "Хоол", bg: "bg-orange-50", text: "text-orange-600" },
    hospital: { label: "Эмнэлэг", bg: "bg-purple-50", text: "text-purple-600" },
    beauty: { label: "Гоо сайхан", bg: "bg-pink-50", text: "text-pink-600" },
  };
  const m = meta[order.shopCategory];
  return (
    <div className="flex items-center justify-between mb-3">
      <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${m.bg} ${m.text}`}>
        {m.label}
      </span>
      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${STATUS_BADGE[order.status]}`}>
        {getStatusLabel(order.shopCategory, order.status)}
      </span>
    </div>
  );
}

function OrderBody({ order }: { order: Order }) {
  switch (order.shopCategory) {
    case "cargo":
      return <CargoDetail order={order} />;
    case "restaurant":
    case "food":
      return <RestaurantDetail order={order} />;
    case "hospital":
      return <HospitalDetail order={order} />;
    case "beauty":
      return <BeautyDetail order={order} />;
    default:
      return null;
  }
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    const found = loadOrders().find((o) => o.id === params.id) ?? null;
    setOrder(found);
  }, [params.id]);

  if (order === undefined) {
    return (
      <main className="w-full min-h-screen bg-gray-50">
        <header className="sticky top-0 bg-white border-b border-gray-200">
          <div className="flex items-center h-14 px-4 gap-3">
            <Link href="/profile/orders" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-base flex-1">Захиалгын дэлгэрэнгүй</h1>
          </div>
        </header>
        <div className="p-8 text-center text-gray-400 text-sm">Уншиж байна...</div>
      </main>
    );
  }

  if (order === null) {
    return (
      <main className="w-full min-h-screen bg-gray-50">
        <header className="sticky top-0 bg-white border-b border-gray-200">
          <div className="flex items-center h-14 px-4 gap-3">
            <Link href="/profile/orders" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-base flex-1">Захиалга олдсонгүй</h1>
          </div>
        </header>
        <div className="p-8 text-center text-gray-400 text-sm">
          Энэ захиалга устгагдсан эсвэл олдсонгүй.
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-12">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/profile/orders" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Захиалгын дэлгэрэнгүй</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <CategoryHeader order={order} />
          <StatusTimeline category={order.shopCategory} status={order.status} />
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Row label="Захиалгын дугаар" value={<span className="font-mono text-xs">{order.id}</span>} />
            <Row label="Үүсгэсэн" value={fmtFull(order.createdAt)} />
          </div>
        </div>

        <OrderBody order={order} />
      </div>
    </main>
  );
}
