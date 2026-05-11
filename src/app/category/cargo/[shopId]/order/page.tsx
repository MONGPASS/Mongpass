'use client';

export const runtime = "edge";

import { ArrowLeft, Plane, Zap, Package, Send, Camera, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CargoRoute,
  CargoType,
  CARGO_TYPE_LABEL,
  loadRoutes,
} from "@/lib/cargoStore";
import {
  CargoOrder,
  addOrder,
  estimateCargoPrice,
  newOrderId,
} from "@/lib/orderStore";
import { uploadImage } from "@/lib/images/upload";

const TYPE_ICON: Record<CargoType, typeof Plane> = {
  air: Plane,
  express: Zap,
  regular: Package,
};

export default function CargoOrderPage({ params }: { params: { shopId: string } }) {
  const searchParams = useSearchParams();
  const initialRouteId = searchParams.get("routeId");

  const [routes, setRoutes] = useState<CargoRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(initialRouteId);
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    loadRoutes(params.shopId).then((r) => {
      if (!active) return;
      setRoutes(r);
      if (!selectedRouteId && r.length > 0) {
        setSelectedRouteId(r[0].id);
      }
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.shopId]);

  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );

  const weightNum = Number(weight) || 0;
  const estimatedPrice = useMemo(() => {
    if (!selectedRoute) return "—";
    return estimateCargoPrice(weightNum, selectedRoute.pricePerKg);
  }, [selectedRoute, weightNum]);

  const canSubmit =
    selectedRoute !== null &&
    description.trim().length > 0 &&
    weightNum > 0 &&
    senderName.trim().length > 0 &&
    senderPhone.trim().length > 0 &&
    receiverName.trim().length > 0 &&
    receiverPhone.trim().length > 0;

  async function submit() {
    if (!selectedRoute || !canSubmit) return;
    // The server fills id / createdAt / status, so the values here are
    // only placeholders to satisfy the type. customer_user_id comes
    // from the session.
    const order: CargoOrder = {
      id: newOrderId(),
      shopCategory: "cargo",
      shopId: params.shopId,
      createdAt: new Date().toISOString(),
      status: "pending",
      routeId: selectedRoute.id,
      routeSnapshot: {
        type: selectedRoute.type,
        fromCity: selectedRoute.fromCity,
        toCity: selectedRoute.toCity,
        pricePerKg: selectedRoute.pricePerKg,
      },
      item: {
        description: description.trim(),
        weight: weight.trim(),
        dimensions: dimensions.trim() || undefined,
        imageDataUrl: imageDataUrl ?? undefined,
      },
      sender: {
        name: senderName.trim(),
        phone: senderPhone.trim(),
        address: senderAddress.trim(),
      },
      receiver: {
        name: receiverName.trim(),
        phone: receiverPhone.trim(),
        address: receiverAddress.trim(),
      },
      estimatedPrice,
    };
    const created = await addOrder(order);
    if (!created) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <Send className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Захиалга илгээгдлээ!</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Карго компани таны захиалгыг хүлээн авсны дараа холбоо барих болно.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/profile/orders"
              className="block w-full bg-primary text-white font-semibold py-3 rounded-xl text-sm"
            >
              Миний захиалгууд руу
            </Link>
            <Link
              href={`/category/cargo/${params.shopId}`}
              className="block w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl text-sm"
            >
              Дэлгүүр рүү буцах
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link
            href={`/category/cargo/${params.shopId}`}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Карго захиалга</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Route picker */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">1. Чиглэл</h2>
          {routes.length === 0 ? (
            <p className="text-xs text-gray-400">Чиглэл байхгүй байна</p>
          ) : (
            <div className="space-y-2">
              {routes.map((r) => {
                const Icon = TYPE_ICON[r.type];
                const active = selectedRouteId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRouteId(r.id)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-colors ${active ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-500"}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                        {CARGO_TYPE_LABEL[r.type]}
                      </p>
                      <p className="font-bold text-sm text-gray-900">
                        {r.fromCity} → {r.toCity}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {r.pricePerKg}/кг · {r.transitDays}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Item info */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">2. Илгээх ачаа</h2>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Тайлбар</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ж: Хувцас, гутал"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Жин (кг)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="5"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Хэмжээ (см)</label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="30×40×20"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Ачааны зураг <span className="font-medium text-gray-400">(заавал биш)</span>
              </label>
              {imageDataUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img src={imageDataUrl} alt="ачаа" className="w-full max-h-60 object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageDataUrl(null)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center"
                    aria-label="Зураг устгах"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    id="cargoItemImage"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      const uploaded = await uploadImage(file, "cargo");
                      if (uploaded) setImageDataUrl(uploaded.url);
                    }}
                  />
                  <label
                    htmlFor="cargoItemImage"
                    className="flex flex-col items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 cursor-pointer active:bg-gray-50"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-medium">Зураг авах / сонгох</span>
                  </label>
                </>
              )}
              <p className="text-[10px] text-gray-400 mt-1">
                Зураг ашигласнаар карго компани ачааг хурдан таних, баталгаажуулахад тусална
              </p>
            </div>
          </div>
        </section>

        {/* Sender */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">
            3. Илгээгч <span className="text-[11px] font-medium text-gray-400">(Korea)</span>
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Нэр</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Болд"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Утас</label>
              <input
                type="tel"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="010-xxxx-xxxx"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Ачаа авах хаяг <span className="font-medium text-gray-400">(заавал биш)</span>
              </label>
              <input
                type="text"
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                placeholder="경기도 안산시 단원구 ..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-1">Карго компанийн ажилтан энэ хаягаас ачаа авах боломжтой</p>
            </div>
          </div>
        </section>

        {/* Receiver */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">
            4. Хүлээн авагч <span className="text-[11px] font-medium text-gray-400">(Mongolia)</span>
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Нэр</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Сараа"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Утас</label>
              <input
                type="tel"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                placeholder="+976-xxxx-xxxx"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Монгол хаяг (хүргэх)
              </label>
              <input
                type="text"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                placeholder="УБ хот, СБД, 1-р хороо ..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Sticky bottom — price breakdown + submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-[480px] mx-auto">
          {selectedRoute && weightNum > 0 ? (
            <div className="mb-2 text-[11px] text-gray-500 leading-relaxed">
              <div className="flex justify-between items-baseline">
                <span>
                  {weightNum}кг × {selectedRoute.pricePerKg}/кг
                </span>
                <span className="font-bold text-base text-gray-900">{estimatedPrice}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-gray-500">Тооцоолсон үнэ</span>
              <span className="font-bold text-base text-gray-400">—</span>
            </div>
          )}
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full bg-blue-500 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Send className="w-4 h-4" /> Захиалга илгээх
          </button>
        </div>
      </div>
    </main>
  );
}
