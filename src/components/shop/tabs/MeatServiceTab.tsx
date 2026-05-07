'use client';

import { useEffect, useMemo, useState } from "react";
import {
  MEAT_PRODUCT_CATEGORIES,
  MeatProduct,
  defaultMeatProducts,
  loadMeatProducts,
} from "@/lib/meatProductStore";

export function MeatServiceTab() {
  const [products, setProducts] = useState<MeatProduct[]>(defaultMeatProducts);
  const [activeCat, setActiveCat] = useState<string>("all");

  useEffect(() => {
    setProducts(loadMeatProducts());
  }, []);

  const categories = useMemo(() => {
    // Show only categories that actually have products, plus "all"
    const set = new Set(products.map((p) => p.category));
    const ordered = MEAT_PRODUCT_CATEGORIES.filter((c) => set.has(c));
    return ["all", ...ordered];
  }, [products]);

  const visible = activeCat === "all" ? products : products.filter((p) => p.category === activeCat);

  return (
    <div className="p-5 bg-gray-50 min-h-[50vh]">
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-3 -mx-1 px-1">
          {categories.map((c) => {
            const active = activeCat === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`shrink-0 px-4 py-2 rounded-full border text-[13px] font-medium whitespace-nowrap ${active ? "bg-orange-500 border-orange-500 text-white" : "border-gray-200 bg-white text-gray-700"}`}
              >
                {c === "all" ? "Бүгд" : c}
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12">Бараа байхгүй байна</p>
      ) : (
        <div className="space-y-3">
          {visible.map((p) => (
            <div
              key={p.id}
              className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {p.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageDataUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] font-bold">
                    IMG
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                  {p.category}
                </p>
                <h4 className="font-bold text-gray-900 text-sm truncate">{p.name}</h4>
                {p.description && (
                  <p className="text-[12px] text-gray-500 truncate mb-1">{p.description}</p>
                )}
                <p className="text-orange-600 font-bold text-sm">
                  {p.price}{" "}
                  <span className="text-[11px] text-gray-500 font-normal">/ {p.unit}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
