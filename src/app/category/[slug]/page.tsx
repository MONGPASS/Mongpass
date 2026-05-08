'use client';

export const runtime = "edge";

import Link from "next/link";
import { ArrowLeft, Search, Map, SlidersHorizontal, ArrowDownUp, Star, MapPin, Store } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { useEffect, useMemo, useState } from "react";
import { Shop, isShopOpen, loadApprovedShops } from "@/lib/shopStore";
import { r2Url } from "@/lib/images/upload";
import { summarizeReviews } from "@/lib/reviewStore";
import { ShopCategory } from "@/components/shop/types";
import { CATEGORY_REGISTRY } from "@/lib/categories";
import { getCurrentUser } from "@/lib/userStore";

/**
 * The slug from the URL doesn't always map 1:1 to a `ShopCategory`:
 *  - "restaurant" and "food" are both valid restaurant categories
 *  - "phone" exists on the home grid but isn't yet a shop category
 * This helper returns every category a shop could live under for the slug.
 */
function shopMatchesSlug(shop: Shop, slug: string): boolean {
  if (shop.category === slug) return true;
  if ((slug === "restaurant" || slug === "food") &&
      (shop.category === "restaurant" || shop.category === "food")) {
    return true;
  }
  return false;
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const slug = params.slug as ShopCategory;
  const title = CATEGORY_REGISTRY[slug]?.label ?? "Үйлчилгээ";

  const [shops, setShops] = useState<Shop[]>([]);
  const [query, setQuery] = useState("");
  const [hasUser, setHasUser] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [all, u] = await Promise.all([loadApprovedShops(), getCurrentUser()]);
      if (!active) return;
      setShops(all.filter((s) => shopMatchesSlug(s, params.slug)));
      setHasUser(u !== null);
      setLoaded(true);
    })();
    return () => { active = false; };
  }, [params.slug]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.description ?? "").toLowerCase().includes(q) ||
      (s.address ?? "").toLowerCase().includes(q),
    );
  }, [shops, query]);

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-[80px]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white px-5 py-3 flex items-center justify-between border-b border-gray-100">
        <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft size={24} className="text-gray-900" />
        </Link>
        <h1 className="text-[18px] font-bold text-gray-900">{title}</h1>
        <div className="flex items-center gap-3">
          <Link href="/search" className="p-1 hover:text-primary transition" aria-label="Хайх">
            <Search size={22} className="text-gray-700" />
          </Link>
          <button className="p-1 hover:text-primary transition" aria-label="Газрын зураг">
            <Map size={22} className="text-gray-700" />
          </button>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Бизнесийн нэрээр хайх..."
            className="w-full bg-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-[14px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-2 mb-1">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-xl text-[14px] font-semibold text-gray-800 hover:bg-gray-50 transition">
            <SlidersHorizontal size={16} /> Шүүх
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-xl text-[14px] font-semibold text-gray-800 hover:bg-gray-50 transition">
            <ArrowDownUp size={16} /> Эрэмбэлэх
          </button>
        </div>
      </div>

      {/* List */}
      {loaded && visible.length === 0 ? (
        <div className="px-5 py-10 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 text-gray-400">
            <Store size={22} />
          </div>
          {shops.length === 0 ? (
            <>
              <p className="text-[14px] font-bold text-gray-700 mb-1">
                {title} ангилалд дэлгүүр бүртгэгдээгүй байна
              </p>
              <p className="text-[12px] text-gray-500 mb-5 leading-relaxed max-w-[280px]">
                Та эхний дэлгүүр болж бүртгүүлэх боломжтой. Бүртгэх нь үнэгүй.
              </p>
              <Link
                href={hasUser ? "/biz/register" : "/login?redirect=/biz/register"}
                className="bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-[13px]"
              >
                Дэлгүүр бүртгэх
              </Link>
            </>
          ) : (
            <p className="text-[13px] text-gray-500">
              &ldquo;{query}&rdquo; гэсэн нэртэй дэлгүүр олдсонгүй
            </p>
          )}
        </div>
      ) : (
        <div className="px-5 py-4 flex flex-col gap-4">
          {visible.map((shop) => (
            <Link
              href={`/category/${params.slug}/${shop.id}`}
              key={shop.id}
              className="bg-white p-3.5 rounded-2xl flex gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-transform"
            >
              <div className="relative w-[90px] h-[90px] rounded-xl shrink-0 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden shadow-sm flex items-center justify-center">
                {shop.images && shop.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r2Url(shop.images[0])} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold opacity-50 text-2xl drop-shadow-md">
                    {shop.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div
                  className={`absolute top-1 left-1 px-1.5 py-[2px] rounded uppercase font-bold text-[9px] text-white shadow-sm ${
                    isShopOpen(shop) ? "bg-emerald-500" : "bg-red-500"
                  }`}
                >
                  {isShopOpen(shop) ? "Нээлттэй" : "Хаалттай"}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[15px] text-gray-900 mb-0.5 truncate">{shop.name}</h3>
                {(() => {
                  const sum = summarizeReviews(shop.id);
                  return (
                    <div className="flex items-center gap-1 mb-1.5">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-[12px] font-bold text-gray-900">
                        {sum.count > 0 ? sum.average.toFixed(1) : "—"}
                      </span>
                      <span className="text-[12px] text-gray-400 font-medium">
                        {sum.count > 0 ? `(${sum.count} сэтгэгдэл)` : "(сэтгэгдэл алга)"}
                      </span>
                    </div>
                  );
                })()}
                {shop.description ? (
                  <p className="text-[12px] leading-snug text-gray-600 line-clamp-2 mb-2">
                    {shop.description}
                  </p>
                ) : (
                  <p className="text-[12px] leading-snug text-gray-400 italic line-clamp-2 mb-2">
                    Танилцуулга оруулаагүй байна
                  </p>
                )}
                {shop.address && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                    <MapPin size={12} className="text-gray-400" />
                    <span className="truncate">{shop.address}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      <BottomNav />
    </main>
  );
}
