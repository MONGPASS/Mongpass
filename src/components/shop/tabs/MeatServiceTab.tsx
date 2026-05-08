import { Beef } from "lucide-react";

// Per-shop meat products land in Phase 4 (D1 table meat_products
// already exists). Until then this public tab shows an honest empty
// state — the previous version reused the global localStorage demo
// so every meat shop looked like it sold the same two cuts.

export function MeatServiceTab() {
  return (
    <div className="p-5 bg-white min-h-[50vh] flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3 text-red-500">
        <Beef className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-gray-700 mb-1">
        Барааны жагсаалт бэлдэгдэж байна
      </p>
      <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
        Махны дэлгүүрийн эзэн удахгүй өөрийн зарж буй бүтээгдэхүүнүүдийг энд нэмэх болно.
      </p>
    </div>
  );
}
