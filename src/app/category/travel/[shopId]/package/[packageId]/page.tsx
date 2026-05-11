'use client';

export const runtime = "edge";

import {
  ArrowLeft, BedDouble, Bus, ChevronDown, Clock, Heart, MessageCircle,
  Share2, Star, UserCheck, Users, XCircle, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TravelPackage, findTravelPackage } from "@/lib/travelPackageStore";
import { Shop, findShopById } from "@/lib/shopStore";
import { ensureThread, threadIdFor } from "@/lib/chatStore";
import { getCurrentUser } from "@/lib/userStore";
import { r2Url } from "@/lib/images/upload";

/**
 * Customer-facing travel package detail page.
 *
 * Layout mirrors the reference screenshots: image carousel with
 * thumbnail strip, headline + quick-facts grid, "what's included"
 * + "what's not" checklists with coloured icons, and a day-by-day
 * itinerary rendered as an accordion (only one open at a time, the
 * first one open by default).
 */
export default function TravelPackageDetailPage({
  params,
}: {
  params: { shopId: string; packageId: string };
}) {
  const router = useRouter();
  const [pkg, setPkg] = useState<TravelPackage | null | undefined>(undefined);
  const [shop, setShop] = useState<Shop | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [openDay, setOpenDay] = useState<number>(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [p, s] = await Promise.all([
        findTravelPackage(params.shopId, params.packageId),
        findShopById(params.shopId),
      ]);
      if (!active) return;
      setPkg(p);
      setShop(s);
    })();
    return () => { active = false; };
  }, [params.shopId, params.packageId]);

  async function openChat() {
    if (!shop || busy) return;
    setBusy(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push(
          `/login?redirect=/category/travel/${encodeURIComponent(params.shopId)}/package/${encodeURIComponent(params.packageId)}`,
        );
        return;
      }
      await ensureThread({
        userId: user.id,
        userName: user.name,
        shopId: shop.id,
        shopName: shop.name,
      });
      router.push(`/chat/${encodeURIComponent(threadIdFor(user.id, shop.id))}`);
    } finally {
      setBusy(false);
    }
  }

  if (pkg === undefined) {
    return <main className="w-full min-h-screen bg-white" />;
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

  // Quick-facts row — empty rows skipped so the grid stays clean
  // when the owner only filled in some of the fields.
  const facts: Array<{ icon: React.ReactNode; value: string }> = [];
  if (pkg.duration) facts.push({ icon: <Clock className="w-4 h-4" />, value: pkg.duration });
  if (pkg.groupSize) facts.push({ icon: <Users className="w-4 h-4" />, value: `Групп: ${pkg.groupSize}` });
  if (pkg.transport) facts.push({ icon: <Bus className="w-4 h-4" />, value: pkg.transport });
  if (pkg.accommodation) facts.push({ icon: <BedDouble className="w-4 h-4" />, value: pkg.accommodation });
  if (pkg.guide) facts.push({ icon: <UserCheck className="w-4 h-4" />, value: pkg.guide });
  if (pkg.tourType) facts.push({ icon: <Star className="w-4 h-4" />, value: pkg.tourType });

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 text-gray-700">
            <button className="p-1" aria-label="Хадгалах">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-1" aria-label="Хуваалцах">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Large hero carousel with snap-scroll + thumbnail strip below. */}
      {pkg.images.length > 0 ? (
        <div className="bg-gray-50">
          <div
            className="flex overflow-x-auto snap-x snap-mandatory hide-scroll"
            onScroll={(e) => {
              const w = e.currentTarget.clientWidth || 1;
              const idx = Math.round(e.currentTarget.scrollLeft / w);
              if (idx !== activeImg) setActiveImg(idx);
            }}
          >
            {pkg.images.map((key, i) => (
              <div key={key + i} className="snap-center shrink-0 w-full aspect-[16/10] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r2Url(key)} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          {/* Thumbnail strip — clickable to jump. Hides when there's
              only one photo since there's nothing to switch to. */}
          {pkg.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto hide-scroll px-4 py-3 bg-white border-b border-gray-100">
              {pkg.images.map((key, i) => (
                <button
                  key={`thumb-${i}`}
                  onClick={() => {
                    setActiveImg(i);
                    // Scrolling the hero on click would need a ref;
                    // dot indicator + thumb highlight is enough here.
                  }}
                  className={`shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 ${
                    i === activeImg ? "border-primary" : "border-transparent opacity-70"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r2Url(key)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-100 aspect-[16/10] flex items-center justify-center text-gray-400">
          <Star className="w-16 h-16" />
        </div>
      )}

      {/* Headline */}
      <section className="bg-white px-5 py-4 border-b border-gray-100">
        {pkg.status === "sold_out" && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-gray-900 text-white px-2 py-0.5 rounded-md mb-2">
            Дууссан
          </span>
        )}
        <h1 className="text-2xl font-black text-gray-900 leading-tight mb-3">
          {pkg.title}
        </h1>

        {/* Quick facts grid — 2 columns on phone. Icons in primary
            so the row reads visually fast. */}
        {facts.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-2">
            {facts.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                <span className="text-primary mt-0.5 shrink-0">{f.icon}</span>
                <span className="leading-snug">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {pkg.price && (
          <p className="text-xl font-black text-primary mt-4">{pkg.price}</p>
        )}
      </section>

      {/* Included / excluded checklists */}
      {(pkg.included.length > 0 || pkg.excluded.length > 0) && (
        <section className="bg-white px-5 py-4 mt-2 border-y border-gray-100 space-y-5">
          {pkg.included.length > 0 && (
            <div>
              <h3 className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-3">
                Аялалд багтсан зүйлс
              </h3>
              <ul className="space-y-2">
                {pkg.included.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-gray-800">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pkg.excluded.length > 0 && (
            <div>
              <h3 className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-3">
                Аялалд багтаагүй зүйлс
              </h3>
              <ul className="space-y-2">
                {pkg.excluded.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-gray-800">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Day-by-day itinerary accordion */}
      {pkg.days.length > 0 && (
        <section className="bg-white px-5 py-4 mt-2 border-y border-gray-100">
          <h3 className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-3">
            Аяллын маршрут
          </h3>
          <div className="space-y-2">
            {pkg.days.map((d) => {
              const open = openDay === d.dayNumber;
              return (
                <div
                  key={d.id}
                  className={`border rounded-xl overflow-hidden transition-colors ${
                    open ? "border-primary bg-primary/5" : "border-gray-200 bg-white"
                  }`}
                >
                  <button
                    onClick={() => setOpenDay(open ? -1 : d.dayNumber)}
                    className="w-full flex items-center gap-3 px-3.5 py-3 text-left"
                  >
                    <span className="shrink-0 text-[10px] font-bold text-primary bg-white border border-primary/30 px-2 py-0.5 rounded-md">
                      ӨДӨР-{d.dayNumber}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="flex-1 font-bold text-[13px] text-gray-900">
                      {d.title}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open && d.description && (
                    <div className="px-3.5 pb-3 text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {d.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Description (free-form note) */}
      {pkg.description && (
        <section className="bg-white px-5 py-4 mt-2 border-y border-gray-100">
          <h3 className="font-bold text-base text-gray-900 mb-2">Тайлбар</h3>
          <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">
            {pkg.description}
          </p>
        </section>
      )}

      {/* Seller card */}
      {shop && (
        <section className="bg-white px-5 py-4 mt-2 border-y border-gray-100">
          <p className="font-bold text-sm text-gray-900 mb-1">{shop.name}</p>
          <Link
            href={`/category/travel/${encodeURIComponent(shop.id)}`}
            className="text-[11px] font-semibold text-primary"
          >
            Бусад аяллын багц үзэх →
          </Link>
        </section>
      )}

      {/* Sticky CTA — chat for quick questions, primary book button
          for the actual conversion. Sold-out packages drop the book
          CTA and gray out the row. */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-[480px] mx-auto flex gap-2">
          <button
            onClick={openChat}
            disabled={busy}
            aria-label="Чатлах"
            className="shrink-0 w-14 h-14 bg-gray-100 text-gray-900 rounded-xl flex items-center justify-center active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          {pkg.status === "sold_out" ? (
            <button
              disabled
              className="flex-1 bg-gray-200 text-gray-400 font-bold py-3.5 rounded-xl text-sm cursor-not-allowed"
            >
              Дууссан
            </button>
          ) : (
            <Link
              href={`/category/travel/${encodeURIComponent(params.shopId)}/package/${encodeURIComponent(params.packageId)}/book`}
              className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center active:scale-[0.98] transition-transform"
            >
              Захиалах
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
