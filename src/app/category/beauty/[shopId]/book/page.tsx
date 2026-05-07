'use client';

export const runtime = "edge";

import { ArrowLeft, Send, Check, Scissors, User } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BeautyService,
  Stylist,
  loadServices,
  loadStylists,
} from "@/lib/beautyStore";
import {
  BeautyAppointment,
  addOrder,
  newOrderId,
} from "@/lib/orderStore";
import { addMyOrderId } from "@/lib/myOrdersStore";

export default function BeautyBookPage({ params }: { params: { shopId: string } }) {
  const searchParams = useSearchParams();
  const initialServiceId = searchParams.get("serviceId");

  const [services, setServices] = useState<BeautyService[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(initialServiceId);
  const [selectedStylistId, setSelectedStylistId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const s = loadServices();
    const st = loadStylists();
    setServices(s);
    setStylists(st);
    if (!selectedServiceId && s.length > 0) setSelectedServiceId(s[0].id);
  }, [selectedServiceId]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );
  const selectedStylist = useMemo(
    () => stylists.find((s) => s.id === selectedStylistId) ?? null,
    [stylists, selectedStylistId],
  );

  const canSubmit =
    selectedService !== null &&
    customerName.trim().length > 0 &&
    customerPhone.trim().length > 0 &&
    preferredDate.trim().length > 0 &&
    preferredTime.trim().length > 0;

  function submit() {
    if (!selectedService || !canSubmit) return;
    const order: BeautyAppointment = {
      id: newOrderId(),
      shopCategory: "beauty",
      shopId: params.shopId,
      createdAt: new Date().toISOString(),
      status: "pending",
      serviceId: selectedService.id,
      serviceSnapshot: {
        name: selectedService.name,
        durationMin: selectedService.durationMin,
        price: selectedService.price,
      },
      stylistId: selectedStylist?.id,
      stylistName: selectedStylist?.name,
      preferredDate: preferredDate.trim(),
      preferredTime: preferredTime.trim(),
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
      },
      notes: notes.trim() || undefined,
    };
    addOrder(order);
    addMyOrderId(order.id);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <Check className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Захиалга илгээгдлээ!</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Салон тантай холбогдож цаг баталгаажуулна.
          </p>
          <Link
            href={`/category/beauty/${params.shopId}`}
            className="block w-full bg-pink-500 text-white font-semibold py-3 rounded-xl text-sm"
          >
            Салон руу буцах
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link
            href={`/category/beauty/${params.shopId}`}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Цаг захиалах</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Service picker */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">1. Үйлчилгээ сонгох</h2>
          {services.length === 0 ? (
            <p className="text-xs text-gray-400">Үйлчилгээ байхгүй байна</p>
          ) : (
            <div className="space-y-2">
              {services.map((s) => {
                const active = selectedServiceId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border ${active ? "border-pink-500 bg-pink-50" : "border-gray-200 bg-white"}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-500"}`}>
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                        {s.category}
                      </p>
                      <p className="font-bold text-sm text-gray-900">{s.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {s.durationMin} мин · <b className="text-gray-900">{s.price}</b>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Stylist picker */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">
            2. Стилист сонгох <span className="text-[11px] font-medium text-gray-400">(заавал биш)</span>
          </h2>
          {stylists.length === 0 ? (
            <p className="text-xs text-gray-400">Стилист байхгүй байна</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedStylistId(null)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border ${selectedStylistId === null ? "border-pink-500 bg-pink-50" : "border-gray-200 bg-white"}`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-gray-700">Аль ч</span>
              </button>
              {stylists.map((s) => {
                const active = selectedStylistId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStylistId(s.id)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border ${active ? "border-pink-500 bg-pink-50" : "border-gray-200 bg-white"}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${active ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-500"}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 text-center px-1 truncate w-full">
                      {s.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Slot */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">3. Хүсэлт өгөх цаг</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Огноо</label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Цаг</label>
              <input
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
              />
            </div>
          </div>
        </section>

        {/* Customer info */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">4. Холбоо барих</h2>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Нэр</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Сараа"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Утас</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="010-xxxx-xxxx"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Тэмдэглэл <span className="font-medium text-gray-400">(заавал биш)</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Урт үстэй / алерги..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-[480px] mx-auto">
          {selectedService && (
            <div className="flex items-baseline justify-between mb-2 text-[11px]">
              <span className="text-gray-500">{selectedService.name}</span>
              <span className="font-bold text-base text-gray-900">{selectedService.price}</span>
            </div>
          )}
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full bg-pink-500 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Send className="w-4 h-4" /> Цаг захиалах
          </button>
        </div>
      </div>
    </main>
  );
}
