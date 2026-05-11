'use client';

export const runtime = "edge";

import { ArrowLeft, Check, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TravelPackage, findTravelPackage } from "@/lib/travelPackageStore";
import {
  TravelBooking,
  addOrder,
  newOrderId,
} from "@/lib/orderStore";
import { getCurrentUser } from "@/lib/userStore";

/**
 * Travel booking form. Captures the minimum the agency needs to plan
 * the trip and contact the customer:
 *  - lead-traveler name + phone (required; agency rings them back)
 *  - email (optional; for confirmation thread)
 *  - headcount split into adults + children (drives per-person price
 *    calc on the agency side)
 *  - preferred start date (HTML date input — universal across phones)
 *  - free-text notes (dietary, mobility, room-type prefs, etc.)
 *
 * Booking is persisted as a generic Order with shopCategory='travel'
 * so it reuses every existing /biz Захиалга surface + notification
 * plumbing — no separate table.
 */
export default function TravelBookingPage({
  params,
}: {
  params: { shopId: string; packageId: string };
}) {
  const router = useRouter();
  const [pkg, setPkg] = useState<TravelPackage | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const u = await getCurrentUser();
      if (!active) return;
      if (!u) {
        router.replace(
          `/login?redirect=/category/travel/${encodeURIComponent(params.shopId)}/package/${encodeURIComponent(params.packageId)}/book`,
        );
        return;
      }
      const p = await findTravelPackage(params.shopId, params.packageId);
      if (!active) return;
      setPkg(p);
    })();
    return () => { active = false; };
  }, [params.shopId, params.packageId, router]);

  if (pkg === undefined) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }
  if (pkg === null) {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <p className="text-sm text-gray-500 mb-4">Багц олдсонгүй.</p>
          <Link
            href={`/category/travel/${encodeURIComponent(params.shopId)}`}
            className="inline-block bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            Дэлгүүр рүү буцах
          </Link>
        </div>
      </main>
    );
  }

  // Parse numbers safely — both fields are number inputs so they
  // arrive as strings; "" should be treated as 0.
  const adultsN = Math.max(0, parseInt(adults, 10) || 0);
  const childrenN = Math.max(0, parseInt(children, 10) || 0);
  const totalTravelers = adultsN + childrenN;

  const canSubmit =
    !busy &&
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    preferredDate.length > 0 &&
    totalTravelers > 0;

  async function submit() {
    if (!canSubmit || !pkg) return;
    setBusy(true);
    try {
      const order: TravelBooking = {
        id: newOrderId(),
        shopCategory: "travel",
        shopId: params.shopId,
        createdAt: new Date().toISOString(),
        status: "pending",
        packageId: pkg.id,
        packageSnapshot: {
          title: pkg.title,
          price: pkg.price,
          duration: pkg.duration,
        },
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
        },
        travelers: { adults: adultsN, children: childrenN },
        preferredDate,
        notes: notes.trim() || undefined,
      };
      const created = await addOrder(order);
      if (created) setSubmitted(true);
    } finally {
      setBusy(false);
    }
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
            Аяллын газар тантай удахгүй холбогдож баталгаажуулна.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/profile/orders"
              className="block w-full bg-primary text-white font-semibold py-3 rounded-xl text-sm"
            >
              Миний захиалгууд руу
            </Link>
            <Link
              href={`/category/travel/${encodeURIComponent(params.shopId)}`}
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
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base flex-1">Аяллын захиалга</h1>
        </div>
      </header>

      {/* Package summary card — confirms what the customer is booking
          so they don't second-guess. */}
      <section className="bg-white px-5 py-4 border-b border-gray-100">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          Захиалж буй багц
        </p>
        <p className="font-bold text-base text-gray-900 leading-snug mb-1">{pkg.title}</p>
        <div className="flex items-center gap-3 text-[12px] text-gray-500">
          {pkg.duration && <span>⏰ {pkg.duration}</span>}
          {pkg.price && <span className="text-primary font-bold">{pkg.price}</span>}
        </div>
      </section>

      <div className="px-4 pt-4 space-y-4">
        {/* Lead traveler info */}
        <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h2 className="font-bold text-sm text-gray-900">Холбоо барих мэдээлэл</h2>
          <div>
            <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
              Нэр <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Бат-Эрдэнэ"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
              Утас <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
              Имэйл <span className="font-medium text-gray-400">(заавал биш — баталгаажуулалт ирнэ)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
        </section>

        {/* Travelers + date */}
        <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h2 className="font-bold text-sm text-gray-900">Аяллын дэлгэрэнгүй</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Том хүн <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Хүүхэд</label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={children}
                onChange={(e) => setChildren(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          {totalTravelers > 0 && (
            <p className="text-[11px] text-gray-500">
              Нийт: <span className="font-bold text-gray-900">{totalTravelers} хүн</span>
            </p>
          )}
          <div>
            <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
              Хүссэн огноо <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Аяллын газар таны хүссэн огноотой ойролцоо нэгтгэж санал болгож болзошгүй.
            </p>
          </div>
        </section>

        {/* Notes */}
        <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h2 className="font-bold text-sm text-gray-900">Нэмэлт хүсэлт</h2>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Хоолны хязгаар, өрөөний сонголт, эрүүл мэндийн онцлог..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
          />
        </section>
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-[480px] mx-auto">
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {busy ? "Илгээж байна..." : "Захиалга илгээх"}
          </button>
        </div>
      </div>
    </main>
  );
}
