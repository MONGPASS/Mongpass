'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Beef } from "lucide-react";
import { MeatProduct, loadMeatProducts } from "@/lib/meatProductStore";

export function MeatServiceTab() {
  const params = useParams();
  const shopId = String(params?.shopId ?? "");
  const [products, setProducts] = useState<MeatProduct[] | null>(null);

  useEffect(() => {
    let active = true;
    if (!shopId) return;
    loadMeatProducts(shopId).then((p) => {
      if (active) setProducts(p);
    });
    return () => { active = false; };
  }, [shopId]);

  if (products === null) {
    return <div className="p-5 bg-white min-h-[50vh]" />;
  }

  if (products.length === 0) {
    return (
      <div className="p-5 bg-white min-h-[50vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3 text-red-500">
          <Beef className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-gray-700 mb-1">Бараа нэмэгдээгүй байна</p>
        <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
          Махны дэлгүүрийн эзэн удахгүй өөрийн бүтээгдэхүүнүүдийг энд нэмэх болно.
        </p>
      </div>
    );
  }

  // Group by category
  const grouped = new Map<string, MeatProduct[]>();
  for (const p of products) {
    const list = grouped.get(p.category) ?? [];
    list.push(p);
    grouped.set(p.category, list);
  }

  return (
    <div className="p-5 bg-white min-h-[50vh] space-y-5">
      {Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category}>
          <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2">
            {category}
          </h3>
          <div className="space-y-2">
            {items.map((p) => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex gap-3">
                <div className="w-16 h-16 rounded-lg bg-red-50 shrink-0 flex items-center justify-center text-red-400">
                  <Beef className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{p.name}</p>
                  {p.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-1 mb-0.5">{p.description}</p>
                  )}
                  <p className="text-[14px] font-bold text-red-600">
                    {p.price}{" "}
                    <span className="text-[11px] text-gray-500 font-normal">/ {p.unit}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
