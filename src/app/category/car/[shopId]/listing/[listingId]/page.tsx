'use client';

export const runtime = "edge";

import { ArrowLeft, CarFront, Heart, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CarListing, findCarListing } from "@/lib/carListingStore";
import { Shop, findShopById } from "@/lib/shopStore";
import { ensureThread, threadIdFor } from "@/lib/chatStore";
import { getCurrentUser } from "@/lib/userStore";
import { r2Url } from "@/lib/images/upload";

/**
 * Customer-facing car listing detail page.
 *
 * Mirrors the unagaa.mn ad layout the user referenced: gallery on
 * top, headline + price, a spec table of every field the owner
 * filled in, then a free-form description, and a sticky "contact"
 * button at the bottom that drops into the chat thread with the shop.
 */

const SPECS: Array<{ key: keyof CarListing; label: string }> = [
  { key: "yearManufactured",  label: "Үйлдвэрлэсэн он" },
  { key: "engineCapacity",    label: "Мотор багтаамж" },
  { key: "transmission",      label: "Хурдны хайрцаг" },
  { key: "steering",          label: "Хүрд" },
  { key: "bodyType",          label: "Төрөл" },
  { key: "engineType",        label: "Хөдөлгүүр" },
  { key: "drive",             label: "Хөтлөгч" },
  { key: "exteriorColor",     label: "Өнгө" },
  { key: "interiorColor",     label: "Дотор өнгө" },
  { key: "mileage",           label: "Явсан" },
  { key: "doors",             label: "Хаалга" },
];

export default function CarListingDetailPage({
  params,
}: {
  params: { shopId: string; listingId: string };
}) {
  const router = useRouter();
  const [listing, setListing] = useState<CarListing | null | undefined>(undefined);
  const [shop, setShop] = useState<Shop | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [l, s] = await Promise.all([
        findCarListing(params.shopId, params.listingId),
        findShopById(params.shopId),
      ]);
      if (!active) return;
      setListing(l);
      setShop(s);
    })();
    return () => { active = false; };
  }, [params.shopId, params.listingId]);

  async function openChat() {
    if (!shop || busy) return;
    setBusy(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push(
          `/login?redirect=/category/car/${encodeURIComponent(params.shopId)}/listing/${encodeURIComponent(params.listingId)}`,
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

  if (listing === undefined) {
    return <main className="w-full min-h-screen bg-white" />;
  }

  if (listing === null) {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <p className="text-sm text-gray-500 mb-4">Зар олдсонгүй.</p>
          <Link
            href={`/category/car/${encodeURIComponent(params.shopId)}`}
            className="inline-block bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            Дэлгүүр рүү буцах
          </Link>
        </div>
      </main>
    );
  }

  // Only render spec rows the owner actually filled in — an empty
  // value column would just be noise.
  const filledSpecs = SPECS.filter((s) => {
    const v = listing[s.key];
    return typeof v === "string" && v.trim().length > 0;
  });

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-32">
      {/* Top bar over the photo carousel — slightly translucent so the
          arrows / heart icons read on any background. */}
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

      {/* Image carousel — horizontal-scroll on phone, snap to each photo. */}
      {listing.images.length > 0 ? (
        <div className="bg-black">
          <div
            className="flex overflow-x-auto snap-x snap-mandatory hide-scroll"
            onScroll={(e) => {
              const w = e.currentTarget.clientWidth || 1;
              const idx = Math.round(e.currentTarget.scrollLeft / w);
              if (idx !== activeImg) setActiveImg(idx);
            }}
          >
            {listing.images.map((key, i) => (
              <div key={key + i} className="snap-center shrink-0 w-full aspect-[4/3] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r2Url(key)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          {listing.images.length > 1 && (
            <div className="flex justify-center gap-1.5 py-2 bg-black/80">
              {listing.images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeImg ? "bg-white w-4" : "bg-white/40 w-1.5"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-100 aspect-[4/3] flex items-center justify-center text-gray-400">
          <CarFront className="w-16 h-16" />
        </div>
      )}

      {/* Headline card — price, title, status pill, location. */}
      <section className="bg-white px-5 py-4 border-b border-gray-100">
        {listing.status === "sold" && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-gray-900 text-white px-2 py-0.5 rounded-md mb-2">
            Зарагдсан
          </span>
        )}
        {listing.price && (
          <p className="text-2xl font-black text-gray-900 mb-1">{listing.price}</p>
        )}
        <h1 className="text-lg font-bold text-gray-900 leading-snug mb-2">
          {listing.title}
        </h1>
        {listing.location && (
          <p className="text-[13px] text-gray-600">
            <span className="text-gray-500">Байршил:</span>{" "}
            <span className="font-semibold">{listing.location}</span>
          </p>
        )}
      </section>

      {/* Spec table — two-column key/value rows. Empty values are
          already filtered out above. */}
      {filledSpecs.length > 0 && (
        <section className="bg-white px-5 py-3 mt-2 border-y border-gray-100">
          <div className="divide-y divide-gray-100">
            {filledSpecs.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between py-2.5">
                <span className="text-[13px] text-gray-500">{label}</span>
                <span className="text-[13px] font-bold text-gray-900 text-right">
                  {String(listing[key])}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Description */}
      {listing.description && (
        <section className="bg-white px-5 py-4 mt-2 border-y border-gray-100">
          <h3 className="font-bold text-base text-gray-900 mb-2">Тайлбар</h3>
          <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">
            {listing.description}
          </p>
        </section>
      )}

      {/* Seller card — shop name + a link to the rest of their listings. */}
      {shop && (
        <section className="bg-white px-5 py-4 mt-2 border-y border-gray-100">
          <p className="font-bold text-sm text-gray-900 mb-1">{shop.name}</p>
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span>Энэ дэлгүүрийн бусад зарууд</span>
            <Link
              href={`/category/car/${encodeURIComponent(shop.id)}`}
              className="font-semibold text-primary"
            >
              Үзэх →
            </Link>
          </div>
        </section>
      )}

      {/* Sticky chat CTA — main action on this page. */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-[480px] mx-auto">
          <button
            onClick={openChat}
            disabled={busy}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4" />
            Худалдагчтай чатлах
          </button>
        </div>
      </div>
    </main>
  );
}
