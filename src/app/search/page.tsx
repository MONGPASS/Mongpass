'use client';

import { ArrowLeft, Search as SearchIcon, MapPin, Star, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Shop, isShopOpen, loadApprovedShops } from "@/lib/shopStore";
import { CATEGORY_REGISTRY } from "@/lib/categories";

export default function SearchPage() {
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    loadApprovedShops().then((s) => {
      if (!active) return;
      setAllShops(s);
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allShops.filter((s) => {
      const categoryLabel = CATEGORY_REGISTRY[s.category]?.label.toLowerCase() ?? "";
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q) ||
        (s.address ?? "").toLowerCase().includes(q) ||
        categoryLabel.includes(q)
      );
    });
  }, [allShops, query]);

  return (
    <main className="w-full min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-2">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 relative">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Дэлгүүр, ангилал, хаяг хайх..."
              className="w-full bg-gray-100 rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>
        </div>
      </header>

      <div className="px-4 py-3">
        {!loaded ? null : query.trim() === "" ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 text-gray-300">
              <SearchIcon className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-400">
              {allShops.length} дэлгүүрээс хайна
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 text-gray-300">
              <Store className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-500">
              &ldquo;<span className="font-bold">{query}</span>&rdquo;-тай тохирох дэлгүүр алга
            </p>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
              {results.length} үр дүн
            </p>
            <div className="flex flex-col gap-3">
              {results.map((shop) => {
                const categoryLabel = CATEGORY_REGISTRY[shop.category]?.label ?? shop.category;
                const cover = shop.images?.[0];
                return (
                  <Link
                    href={`/category/${shop.category}/${shop.id}`}
                    key={shop.id}
                    className="bg-white p-3.5 rounded-2xl flex gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-transform"
                  >
                    <div className="relative w-[80px] h-[80px] rounded-xl shrink-0 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={shop.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold opacity-50">
                          {shop.name.slice(0, 1).toUpperCase()}
                        </div>
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
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                        {categoryLabel}
                      </p>
                      <h3 className="font-bold text-[14px] text-gray-900 truncate mb-1">
                        {shop.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-1">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[11px] font-bold text-gray-900">—</span>
                      </div>
                      {shop.description && (
                        <p className="text-[11px] text-gray-500 line-clamp-1 mb-1">
                          {shop.description}
                        </p>
                      )}
                      {shop.address && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <MapPin size={10} className="text-gray-400" />
                          <span className="truncate">{shop.address}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
