'use client';

import { Heart, Star, Share2, ArrowLeft, BadgeCheck, MessageCircle } from "lucide-react";
import { ShopCategory, ShopData } from "./types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isFavorite, toggleFavorite } from "@/lib/favoriteStore";
import { getCurrentUser } from "@/lib/userStore";
import { ensureThread, threadIdFor } from "@/lib/chatStore";

export function TopNavBar({ shopId }: { shopId?: string }) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    let active = true;
    getCurrentUser().then((user) => {
      if (active) setFavorite(isFavorite(user?.id ?? null, shopId));
    });
    return () => { active = false; };
  }, [shopId]);

  async function handleToggleFavorite() {
    if (!shopId) return;
    const user = await getCurrentUser();
    setFavorite(toggleFavorite(user?.id ?? null, shopId));
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white sticky top-0 z-50">
      <button onClick={() => router.back()} className="p-1 -ml-1 flex items-center justify-center text-gray-900">
        <ArrowLeft size={28} strokeWidth={1.5} />
      </button>
      <div className="flex items-center gap-4 text-gray-900">
        <button onClick={handleToggleFavorite} aria-label={favorite ? "Хадгалснаас хасах" : "Хадгалах"}>
          <Heart
            size={26}
            strokeWidth={1.5}
            className={favorite ? "fill-red-500 text-red-500" : ""}
          />
        </button>
        <button><Share2 size={26} strokeWidth={1.5} /></button>
      </div>
    </div>
  );
}

export function ShopHeader({ shop }: { shop: ShopData }) {
  const closed = shop.isOpen === false;
  return (
    <div className="px-5 pt-2 pb-5 bg-white space-y-3">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[22px] font-bold text-gray-900 leading-tight">{shop.name}</h1>
      </div>

      <div className="flex items-center gap-2 text-[13px] text-gray-600 flex-wrap">
        <div className="flex items-center gap-1">
          <Star size={14} className="fill-[#FF7E36] text-[#FF7E36]" />
          <span className="font-bold text-gray-900">{shop.rating}</span>
        </div>
        <span>·</span>
        <span>Сэтгэгдэл {shop.reviews}</span>
        <span
          className={`ml-1 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
            closed ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${closed ? "bg-red-500" : "bg-emerald-500"}`} />
          {closed ? "Хаалттай" : "Нээлттэй"}
        </span>
      </div>

      <div className="flex items-center gap-1 text-[13px] text-blue-600 font-medium pb-2">
        <BadgeCheck size={16} className="fill-blue-600 text-white" />
        Баталгаажсан газар
      </div>
    </div>
  );
}

export function ImageGallery({ images }: { images: string[] }) {
  // No photos yet → don't take up vertical space at the top of the page.
  if (images.length === 0) return null;

  return (
    <div className="bg-white pb-5">
      <div className="flex overflow-x-auto hide-scroll px-5 gap-3 snap-x snap-mandatory">
        {images.map((src, i) => (
          <div
            key={i}
            className="snap-start shrink-0 w-[160px] h-[220px] md:w-[240px] md:h-[320px] bg-gray-100 rounded-xl overflow-hidden relative border border-gray-100/50"
          >
            {src ? (
              // base64 / blob / external URL — let the browser resolve.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={`Дэлгүүрийн зураг ${i + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-bold bg-gray-50">
                IMAGE {i + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TabMenu({ 
  activeTab, 
  setActiveTab, 
  serviceTabName 
}: { 
  activeTab: string, 
  setActiveTab: (t: string) => void,
  serviceTabName: string
}) {
  const tabs = [
    { id: "home", label: "Нүүр" },
    { id: "info", label: "Мэдээлэл" },
    { id: "service", label: serviceTabName },
    { id: "review", label: "Сэтгэгдэл" },
    { id: "photo", label: "Зураг" }
  ];

  return (
    <div className="flex border-b border-gray-200 bg-white sticky top-0 z-40 px-2 overflow-x-auto hide-scroll">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 min-w-max px-4 py-3.5 text-sm font-semibold transition-colors border-b-2 
            ${activeTab === tab.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500"}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Map a shop category to its dedicated order/booking route. Returns null
 * for categories that don't have a transactional flow (community/info-only),
 * in which case the order button is hidden entirely.
 */
function orderRouteFor(category: ShopCategory | undefined, shopId: string): string | null {
  switch (category) {
    case "cargo":
      return `/category/cargo/${shopId}/order`;
    case "restaurant":
    case "food":
      return `/category/restaurant/${shopId}/checkout`;
    case "hospital":
      return `/category/hospital/${shopId}/book`;
    case "beauty":
      return `/category/beauty/${shopId}/book`;
    default:
      // meat / car / travel / other — no dedicated order route yet.
      return null;
  }
}

export function BottomCTA({
  text,
  shop,
  category,
  onCtaClick,
}: {
  text: string;
  shop?: ShopData;
  category?: ShopCategory;
  /** Optional override; if omitted, BottomCTA routes by category. */
  onCtaClick?: () => void;
}) {
  const router = useRouter();
  const shopId = shop ? String(shop.id) : "";
  const orderRoute = orderRouteFor(category, shopId);
  const closed = shop?.isOpen === false;
  const showOrderButton = Boolean(orderRoute || onCtaClick);

  async function handleChat() {
    if (!shop) return;
    const user = await getCurrentUser();
    if (!user) {
      router.push(`/login?redirect=/category/${encodeURIComponent(shopId)}`);
      return;
    }
    // Ensure a thread exists, then jump to it. If the user is also the
    // shop owner we still allow it (they'd see their own thread shell).
    ensureThread({
      userId: user.id,
      userName: user.name,
      shopId,
      shopName: shop.name,
    });
    router.push(`/chat/${encodeURIComponent(threadIdFor(user.id, shopId))}`);
  }

  async function handleOrder() {
    if (closed) return;
    if (onCtaClick) {
      onCtaClick();
      return;
    }
    if (!orderRoute) return;
    const user = await getCurrentUser();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(orderRoute)}`);
      return;
    }
    router.push(orderRoute);
  }

  return (
    <div className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-100 p-4 pb-safe z-50">
      <div className="flex gap-2">
        {showOrderButton ? (
          <>
            {/* Чатлах — secondary, icon-only square */}
            <button
              onClick={handleChat}
              aria-label="Чатлах"
              className="shrink-0 w-14 h-14 bg-gray-100 text-gray-900 rounded-xl flex items-center justify-center active:scale-[0.98] transition-transform"
            >
              <MessageCircle size={22} strokeWidth={2} />
            </button>
            {/* Захиалах — primary, takes remaining space */}
            <button
              onClick={handleOrder}
              disabled={closed}
              className={`flex-1 font-bold py-3.5 rounded-xl text-center active:scale-[0.98] transition-transform ${
                closed
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-primary text-white"
              }`}
            >
              {closed ? "Хаалттай" : text}
            </button>
          </>
        ) : (
          /* Non-transactional category → Чатлах takes full width */
          <button
            onClick={handleChat}
            className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl text-center active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} strokeWidth={2} />
            Чатлах
          </button>
        )}
      </div>
    </div>
  );
}
